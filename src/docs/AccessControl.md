# Access Control in Donkeylift

Donkeylift (DL) as a data storage service needs to provide access control to its data. Although we strive for maximum simplicity, we must cover basic database-level security and common application-level access control scenarios. 

If an application has security requirements more fine-grained or sofisticated than DL has built-in, it will have to be implemented through some intermediate, server-based security broker.

All data requests to the Donkeylift API bear an Authentication token (JSON web token) identifying the caller. Access Control is implemented by matching the caller identity against access control rules stored on the DL server.

The auth token encodes the following fields:

```json
{
  "name": "admin@donkeylift.com",	
  "account": "demo",
  "admin": true
}
```

* `name` Unique username, the initial email when signing up.
* `account` Unique account name, identifying a collection of databases.
* `admin` Boolean stating whether user is an admin of the account. 

## Admin

An account admin is somebody with full access to the collection of databases. The admin is authorized to call any API method referring to the account. This role is necessary to create databases.

## User Roles

Donkeylift defines three user roles: `owner`, `writer` and `reader`. Each user may have only one role.

User roles are defined at a database level, meaning the roles apply only to a specific database. Users with their roles are stored on each database separately. 

```json
{ "users": [
	{ "name": "admin_db@donkeylift.com", "role": "owner" },
	{ "name": "user@donkeylift.com", "role": "writer" },
	{ "name": "visitor@donkeylift.com", "role": "reader" }
]}
```

* `owner` Full access to the database. Authorized to call any API method referring to this database.
* `writer` Write or first level access to tables in the database. Exact permissions depend on table-level security.
* `reader` Read or second level access to tables in the database. Exact permissions depend on table-level security.

## Table-Level and Row-Level Access Control 

Each table may define their own access control rules for both `writer` and `reader` roles. The rules state explicitly how rows can be written and read. If not stated explicitly, the following defaults apply:

```json
{ "access_control": [
	{ "role": "writer", "write": "own", "read": "all" },
	{ "role": "reader", "write": "none", "read": "all" }
]}
```

* `role` User's role to apply rule. Possible values are `reader` and `writer`.
* `write` Writeable rows by `role`. Possible values are `all`, `own`, `none`.
* `read` Readable rows by `role`. Possible values are `all`, `own`, `none`.

A rule stating that only `own` rows may be written is implemented as permission to:

* Insert rows
* Update and Delete own rows (inserted by the user).

A rule stating that only `own` rows may be read is implemented by:

* All Select queries filter out rows not owned by the user. 

`all` and `none` implementations are straightforward.

### Example rules 

* Shared table (default)

```json
[
	{ "role": "writer", "write": "own", "read": "all" },
	{ "role": "reader", "write": "none", "read": "all" }
]
```

* Private table

```json
[
	{ "role": "writer", "write": "own", "read": "own" },
	{ "role": "reader", "write": "none", "read": "own" }
]
```

* Read-only table

```json
[
	{ "role": "writer", "write": "none", "read": "all" },
	{ "role": "reader", "write": "none", "read": "all" }
]
```

* Hidden table

```json
[
	{ "role": "writer", "write": "none", "read": "none" },
	{ "role": "reader", "write": "none", "read": "none" }
]
```

