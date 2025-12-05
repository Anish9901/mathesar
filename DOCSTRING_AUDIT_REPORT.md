# RPC Endpoint Docstring Audit Report

## Overview
Audit of RPC endpoint docstrings to ensure function signatures match documentation. This is used to verify that the generated API documentation is accurate.

**Total Endpoints Checked:** 104
**Files with Issues:** 9/26
**Total Issues Found:** 17

---

## Issues Summary

### HIGH Severity (9 issues) - Parameter Documentation Mismatch
These endpoints have parameters in their function signature that are NOT documented in the Args section of their docstrings.

1. **`data_modeling.py` - `add_foreign_key_column` (line 14)**
   - Undocumented parameter: `database_id`
   - Action: Add documentation for `database_id` in Args section

2. **`data_modeling.py` - `add_mapping_table` (line 53)**
   - Undocumented parameter: `database_id`
   - Action: Add documentation for `database_id` in Args section

3. **`databases/privileges.py` - `replace_for_roles` (line 52)**
   - Undocumented parameters: `database_id`, `privileges`
   - Action: Add documentation for both parameters in Args section

4. **`databases/privileges.py` - `transfer_ownership` (line 83)**
   - Undocumented parameters: `database_id`, `new_owner_oid`
   - Action: Add documentation for both parameters in Args section

5. **`roles/base.py` - `set_members` (line 162)**
   - Undocumented parameter: `database_id`
   - Action: Add documentation for `database_id` in Args section

6. **`schemas/privileges.py` - `transfer_ownership` (line 89)**
   - Undocumented parameters: `database_id`, `new_owner_oid`, `schema_oid`
   - Action: Add documentation for all three parameters in Args section

7. **`servers/configured.py` - `patch` (line 60)**
   - Undocumented parameter: `server_id`
   - Missing documented parameter: documented as `server` but actual param is `server_id`
   - Action: Change documentation from `server` to `server_id`

8. **`tables/privileges.py` - `transfer_ownership` (line 86)**
   - Undocumented parameters: `database_id`, `new_owner_oid`, `table_oid`
   - Action: Add documentation for all three parameters in Args section

### MEDIUM Severity (8 issues)

#### Missing Returns Documentation (6 issues)
These endpoints return a value but their docstrings don't have a Returns section:

1. **`collaborators.py` - `add` (line 55)**
   - Returns: `CollaboratorInfo`
   - Action: Add Returns section documenting the returned CollaboratorInfo object

2. **`collaborators.py` - `set_role` (line 95)**
   - Returns: `CollaboratorInfo`
   - Action: Add Returns section documenting the returned CollaboratorInfo object

3. **`data_modeling.py` - `suggest_types` (line 81)**
   - Returns: `dict`
   - Action: Add Returns section

4. **`databases/configured.py` - `disconnect` (line 117)**
   - Returns: `DisconnectResult`
   - Action: Add Returns section documenting the returned DisconnectResult

5. **`databases/setup.py` - `create_new` (line 43)**
   - Returns: `DatabaseConnectionResult`
   - Action: Add Returns section documenting the returned DatabaseConnectionResult

6. **`databases/setup.py` - `connect_existing` (line 79)**
   - Returns: `DatabaseConnectionResult`
   - Action: Add Returns section documenting the returned DatabaseConnectionResult

#### Extra/Wrong Documented Parameters (2 issues)
These endpoints have parameters documented that don't match the actual function signature:

1. **`databases/setup.py` - `create_new` (line 43)**
   - Documented: "members are" (appears to be parsing error)
   - Action: Verify and correct the parameter documentation

2. **`databases/setup.py` - `connect_existing` (line 79)**
   - Documented: "members are" (appears to be parsing error)
   - Action: Verify and correct the parameter documentation

---

## Next Steps

1. **Verify before making changes** - For each issue, check the function signature and understand what the parameter represents
2. **Don't alter semantics** - Only add missing documentation; don't rewrite existing descriptions
3. **Use consistent format** - Follow the existing docstring format in the file
4. **Consider**: The types like `(int)` are auto-generated in docs, so focus on meaningful descriptions

## Notes
- The `(int)`, `(str)`, etc. types shown in generated docs come from the function's type annotations, not the docstring
- This audit focuses only on RPC endpoints (functions decorated with `@mathesar_rpc_method`)
- Helper methods like `from_dict()` and `from_model()` are not included in this audit
