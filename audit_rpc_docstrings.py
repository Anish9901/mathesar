#!/usr/bin/env python
"""
Audit RPC endpoint docstrings to verify they match function signatures.

This script specifically checks RPC endpoints (decorated with @mathesar_rpc_method)
to ensure that:
1. All function parameters (except **kwargs) are documented in the docstring
2. All documented parameters actually exist in the function signature
3. Returns section is documented for functions that return values
"""

import ast
import os
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple


class RPCDocstringAuditor(ast.NodeVisitor):
    """Visit Python AST to extract RPC endpoint info and check docstrings."""
    
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.endpoints = []
        
    def visit_FunctionDef(self, node: ast.FunctionDef):
        """Visit function definitions and check if they're RPC endpoints."""
        # Check if function has @mathesar_rpc_method decorator
        is_rpc_endpoint = any(
            self._is_rpc_decorator(decorator)
            for decorator in node.decorator_list
        )
        
        if is_rpc_endpoint:
            params = self._extract_parameters(node)
            docstring = ast.get_docstring(node)
            
            info = {
                'name': node.name,
                'lineno': node.lineno,
                'parameters': params,
                'docstring': docstring,
                'return_type': self._extract_return_type(node),
            }
            
            if docstring:
                info['documented_params'] = self._extract_documented_params(docstring)
                info['has_returns_docs'] = self._has_returns_section(docstring)
            else:
                info['documented_params'] = set()
                info['has_returns_docs'] = False
            
            self.endpoints.append(info)
        
        self.generic_visit(node)
    
    @staticmethod
    def _is_rpc_decorator(decorator) -> bool:
        """Check if decorator is @mathesar_rpc_method."""
        if isinstance(decorator, ast.Call):
            if isinstance(decorator.func, ast.Name):
                return decorator.func.id == 'mathesar_rpc_method'
            elif isinstance(decorator.func, ast.Attribute):
                return decorator.func.attr == 'mathesar_rpc_method'
        elif isinstance(decorator, ast.Name):
            return decorator.id == 'mathesar_rpc_method'
        return False
    
    @staticmethod
    def _extract_parameters(node: ast.FunctionDef) -> Set[str]:
        """Extract all parameters from a function definition, excluding **kwargs and self."""
        params = set()
        for arg in node.args.args:
            if arg.arg not in ('self', 'cls', 'kwargs'):
                params.add(arg.arg)
        
        # Add keyword-only args (but not if they're **kwargs)
        for arg in node.args.kwonlyargs:
            if arg.arg not in ('self', 'cls', 'kwargs'):
                params.add(arg.arg)
        
        return params
    
    @staticmethod
    def _extract_return_type(node: ast.FunctionDef) -> Optional[str]:
        """Extract the return type annotation if present."""
        if node.returns:
            return ast.unparse(node.returns)
        return None
    
    @staticmethod
    def _extract_documented_params(docstring: str) -> Set[str]:
        """Extract documented parameters from a docstring."""
        documented = set()
        lines = docstring.split('\n')
        in_args_section = False
        
        for line in lines:
            stripped = line.strip()
            
            # Check if we're entering Args section
            if stripped.startswith('Args:'):
                in_args_section = True
                continue
            
            # Check if we're leaving Args section (new section starts)
            if in_args_section and stripped and stripped[0].isupper() and stripped.endswith(':'):
                if stripped != 'Args:':
                    in_args_section = False
                    continue
            
            # Extract parameter names from "param_name:" format
            if in_args_section and ':' in stripped:
                param_part = stripped.split(':')[0].strip()
                # Handle parameter with type hints like "param_name (type)"
                if '(' in param_part:
                    param_part = param_part.split('(')[0].strip()
                if param_part and not param_part.startswith('*'):
                    documented.add(param_part)
        
        return documented
    
    @staticmethod
    def _has_returns_section(docstring: str) -> bool:
        """Check if docstring has a Returns section."""
        return 'Returns:' in docstring


def audit_rpc_file(filepath: str) -> Dict:
    """Audit a single RPC file for endpoint docstring inconsistencies."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        auditor = RPCDocstringAuditor(filepath)
        auditor.visit(tree)
        
        issues = []
        for endpoint in auditor.endpoints:
            # Check for missing docstring
            if not endpoint['docstring']:
                issues.append({
                    'type': 'missing_docstring',
                    'endpoint': endpoint['name'],
                    'lineno': endpoint['lineno'],
                    'message': f"Missing docstring for endpoint '{endpoint['name']}'",
                    'severity': 'high',
                })
                continue
            
            # Check for undocumented parameters
            undocumented = endpoint['parameters'] - endpoint['documented_params']
            if undocumented:
                issues.append({
                    'type': 'undocumented_params',
                    'endpoint': endpoint['name'],
                    'lineno': endpoint['lineno'],
                    'message': f"Parameters not documented in Args: {', '.join(sorted(undocumented))}",
                    'parameters': sorted(undocumented),
                    'severity': 'high',
                })
            
            # Check for documented but non-existent parameters
            extra_documented = endpoint['documented_params'] - endpoint['parameters']
            if extra_documented:
                issues.append({
                    'type': 'extra_documented_params',
                    'endpoint': endpoint['name'],
                    'lineno': endpoint['lineno'],
                    'message': f"Documented parameters don't exist in signature: {', '.join(sorted(extra_documented))}",
                    'parameters': sorted(extra_documented),
                    'severity': 'medium',
                })
            
            # Check for missing Returns documentation
            if endpoint['return_type'] and endpoint['return_type'] != 'None' and not endpoint['has_returns_docs']:
                issues.append({
                    'type': 'missing_returns_docs',
                    'endpoint': endpoint['name'],
                    'lineno': endpoint['lineno'],
                    'message': f"Function returns {endpoint['return_type']} but has no Returns section in docstring",
                    'return_type': endpoint['return_type'],
                    'severity': 'medium',
                })
        
        return {
            'filepath': filepath,
            'issues': issues,
            'endpoints_checked': len(auditor.endpoints),
        }
    
    except Exception as e:
        return {
            'filepath': filepath,
            'error': str(e),
            'endpoints_checked': 0,
            'issues': [],
        }


def main():
    """Audit all RPC files for endpoint docstring issues."""
    rpc_dir = Path('mathesar/rpc')
    
    if not rpc_dir.exists():
        print(f"RPC directory not found: {rpc_dir}")
        return
    
    # Find all Python files in rpc directory
    rpc_files = []
    for py_file in rpc_dir.rglob('*.py'):
        if py_file.name.startswith('_'):
            continue
        rpc_files.append(py_file)
    
    rpc_files.sort()
    
    print(f"Auditing RPC Endpoint Docstrings")
    print(f"=" * 80)
    print(f"Found {len(rpc_files)} RPC files to audit\n")
    
    total_issues = 0
    files_with_issues = 0
    total_endpoints = 0
    
    for filepath in rpc_files:
        result = audit_rpc_file(str(filepath))
        
        if result.get('error'):
            print(f"❌ ERROR in {filepath}: {result['error']}")
            continue
        
        total_endpoints += result['endpoints_checked']
        
        if result['issues']:
            files_with_issues += 1
            total_issues += len(result['issues'])
            
            print(f"\n📄 {filepath}")
            print(f"   Endpoints checked: {result['endpoints_checked']}")
            print(f"   Issues found: {len(result['issues'])}")
            
            for issue in result['issues']:
                severity_icon = "🔴" if issue['severity'] == 'high' else "🟡"
                print(f"\n   {severity_icon} [{issue['severity'].upper()}] {issue['type']}")
                print(f"       Endpoint: {issue['endpoint']} (line {issue['lineno']})")
                print(f"       Message: {issue['message']}")
    
    print("\n" + "=" * 80)
    print(f"📊 Summary:")
    print(f"   Total endpoints checked: {total_endpoints}")
    print(f"   Files with issues: {files_with_issues}/{len(rpc_files)}")
    print(f"   Total issues: {total_issues}")
    
    if total_issues == 0:
        print(f"\n✅ All RPC endpoint docstrings are properly documented!")


if __name__ == '__main__':
    main()
