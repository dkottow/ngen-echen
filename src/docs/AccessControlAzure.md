# Access Control in Data365

Data365 provides access control through the Azure Active Directory service. Users will need to first authenticate against AAD before being able to access any data. 

Once authenticated, all calls to the API will bear a security token that not only identifies the user, but also includes information on relevant security groups to determine the users' general access rights. 

You can read more about AAD security tokens and claims [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-token-and-claims). We are using OpenID Connect and the associated JWT Id_token. 

The security token encodes the following fields relevant to the Data365 security model:

```json
{
  "upn": "dkottow@golder.com",
  "groups": [
    "0e129f6b-6b0a-4944-982d-f776000632af",
    "323b13b3-1851-4b94-947f-9a4dacb595f4",
    "6e32c250-9b0a-4491-b429-6c60d2ca9a42"
  ]
}
```

* `upn` Unique username, corresponds to our AAD user.
* `groups` GUID's identifying AAD groups. Note that AAD will only include groups that have been previously assigned to the Data365 application manifest in AAD.

Permissions on specific databases and API methods are obtained through a Data365 owned Access Control List described later in this document. Permissions are defined using the following concepts.

## System Admin

A system admin has full access to all accounts. It is the only security role allowed to create new accounts.

## Account Admin

An account admin is bound to a certain account; he has full access to the collection of databases belonging to it. Only account admins can create new databases.

## Database Admin

A database admin is bound to a certain database; he has full access to all data in the database. Only database admins can execute schema change methods (resulting in DDL statements).

## Data Access Permissions

For regular users we define permission levels to read and write data. There are different variants of read and write access which rely on a row ownership model. All tables in Data365 have an `own_by` field to establish the owner of each row. Owners may be users or groups. Based on the row ownership, Data365 distinguishes three row scoping modifiers - `all`, `own` and `none` - which are combined with the access mode (read-only / read-write) providing the following permissions:  

### Read Only 
* `read: none, write: none`
* `read: own, write: none`
* `read: all, write: none`

### Read Write 
* `read: own, write: own`
* `read: all, write: own`
* `read: all, write: all`

Data access permissions are defined at the database level, but may be overwritten by an explicit table level permission. 

### Table Level Permission

A table level permissions can have the same values as the user or group permissions defined at the database level. To determine the resulting permission for a particular table and user, the table level permission is combined with the user's (or group's) database-level permission using the following rules. 

| User | Table | Result |
| --- | ----- | ------ |
| none | * | none |
| own | none | none |
| all | none | none |
| own | own | own |
| all | own | own |
| own | all | all |
| all | all | all |

Notes: Read and write permissions obey the same table-level overwrite rules.

### Ownership Column
The ownerhip field `own_by` can be a user (upn value) or a group (GUID). It can also be `null` which means the anybody with `all` or `own` read (write) access to the table can act on such a row.

### SQL Implementation 

A rule stating that only `own` rows can be written is implemented as permission to:

* Insert rows
* Update and Delete own rows (inserted by the user).

A rule stating that only `own` rows may be read is implemented by:

* All Select queries filter out rows not owned by the user. 

`all` and `none` implementations are straightforward.

### ACL for Database-level Roles and Permissions 

| Principal | Account | Database | Admin | Read | Write | Comment |
| --------- | ------- | -------- | ----- | ---- | ----- | ------- |
| dkottow@golder.com | * | * | 1 | all | all | System Admin |
| harmitage@golder.com | Geotech | * | 1 | all | all | Account Admin on Geotech |
| Soils User Group | Geotech | Soils | 0 | all | own | Reads all data, writes only own data |
| jstianson@golder.com | Geotech | Soils | 0 | all | all | Soils data owner |
| Geotech Visitor | Geotech | * | 0 | all | none | Reads all data in any database of Geotech but writes nothing. |

### Overwriting Permissions at Table-level
Are defined as json.

