[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# friends-backend
This is a [Moleculer](https://moleculer.services/)-based microservices project. Generated with the [Moleculer CLI](https://moleculer.services/docs/0.14/moleculer-cli.html).

## API

### Users
| Purpose | Path | Method | Params | Body | Return value |
| ------- | ---- | ------ | ------ | ---- | ------------ |
| Search users in the AD | /api/users  | GET | partialName | X | [{ displayName: string, sAMAccountName: string }] |
| Get by kartoffel id | /api/users/kartoffel/:id | GET | X | X | KartoffelUser |
| Get by domain user | /api/users/domainuser/:domainuser | GET | X | X | KartoffelUser |
| If user is super | /api/users/super | GET | X | X | Boolean |
| If user is approver | /api/users/approver | GET | X | X | Boolean |
| Search approvers | /api/users/approvers | GET | pratialName | X | [KartoffelUser] |

### Join
| Purpose | Path | Method | Params | Body | Return value |
| ------- | ---- | ------ | ------ | ---- | ------------ |
| Create join request | /api/join/request | POST | X | JoinRequest | JoinRequest |
| Approve join request | /api/join/approve/:id | PUT | X | X | X |
| Deny join request | /api/join/deny/:id | PUT | X | X | X |
| Get join requests created by the user | /api/join/requests/creator | X | X | { requests: [JoinRequest] } |
| Get pending join requests that can be approved by the user | /api/join/requests/approver | X | X | { requests: [JoinRequest] } |

### Owner
| Purpose | Path | Method | Params | Body | Return value |
| ------- | ---- | ------ | ------ | ---- | ------------ |
| Create owner request | /api/owner/request | POST | X | OwnerRequest | OwnerRequest |
| Approve owner request | /api/owner/approve/:id | PUT | X | X | X |
| Deny owner request | /api/owner/deny/:id | PUT | X | X | X |
| Get owner requests created by the user | /api/owner/requests/creator | X | X | { requests: [OwnerRequest] } |
| Get pending owner requests that can be approved by the user | /api/owner/requests/approver | X | X | { requests: [OwnerRequest] } |

### Create
| Purpose | Path | Method | Params | Body | Return value |
| ------- | ---- | ------ | ------ | ---- | ------------ |
| Create create request | /api/create/request | POST | X | CreateRequest | CreateRequest |
| Approve create request | /api/create/approve/:id | PUT | X | X | X |
| Deny create request | /api/create/deny/:id | PUT | X | X | X |
| Get create requests created by the user | /api/create/requests/creator | X | X | { requests: [CreateRequest] } |
| Get pending create requests that can be approved by the user | /api/create/requests/approver | X | X | { requests: [CreateRequest] } |

### AD service
| Purpose | Path | Method | Params | Body | Return value |
| ------- | ---- | ------ | ------ | ---- | ------------ |
| Get group by id | /api/ad/groups/:groupId | GET | X | X | ADGroup |
| Search distribution groups by name | /api/ad/groups/distribution | GET | partialName | X | [ADGroup] |
| Search security groups by name | /api/ad/groups/security | GET | partialName | X | [ADGroup] |
| Get user's groups | /api/ad/groups/user | GET | X | X | [ADGroup] |
| Delete group by id | /api/ad/group/:groupId | DELETE | X | X | { success: Boolean } |
| Remove users from group | /api/ad/group/users | DELETE | X | { groupId: string, users: [string] } | 200 OK |
| Update group (group name or group display name) | /api/ad/group/:groupId | PUT | X | { groupId: string, displayName: string, name: string } | { message: 'successfully updated all parameters', success: true } |

### Objects
#### ADGroup
```json
{
    "classification": "string",
    "displayName": "string",
    "sAMAccountName": "string",
    "name": "string",
    "type": "string",
    "owner": {
        "displayName": "string",
        "sAMAccountName": "string",
    },
    "members": [ { "displayName": "string", "sAMAccountName": "string" } ],
}
```
#### CreateRequest
```json
{
    "creator": "string",
    "approver": "string",
    "group": {
        "groupName": "string",
        "hierarchy": "string",
        "displayName": "string",
        "classification": "string",
        "owner": "string",
        "members": [ "string" ],
        "type": "string",
    },
}
```
#### JoinRequest
```json
{
    "creator": "string",
    "approver": "string",
    "groupId": "string",
    "joinReason": "string",
}
```
#### OwnerRequest
```json
{
    "creator": "string",
    "approver": "string",
    "groupId": "string",
}
```

## Usage
Start the project with `npm run dev` command. 
After starting, open the http://localhost:3000/ URL in your browser. 
On the welcome page you can test the generated services via API Gateway and check the nodes & services.

In the terminal, try the following commands:
- `nodes` - List all connected nodes.
- `actions` - List all registered service actions.
- `call greeter.hello` - Call the `greeter.hello` action.
- `call greeter.welcome --name John` - Call the `greeter.welcome` action with the `name` parameter.
- `call products.list` - List the products (call the `products.list` action).


## Services
- **api**: API Gateway services
- **greeter**: Sample service with `hello` and `welcome` actions.
- **products**: Sample DB service. To use with MongoDB, set `MONGO_URI` environment variables and install MongoDB adapter with `npm i moleculer-db-adapter-mongo`.

## Mixins
- **db.mixin**: Database access mixin for services. Based on [moleculer-db](https://github.com/moleculerjs/moleculer-db#readme)


## Useful links

* Moleculer website: https://moleculer.services/
* Moleculer Documentation: https://moleculer.services/docs/0.14/

## NPM scripts

- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
- `npm run ci`: Run continuous test mode with watching
- `npm test`: Run tests & generate coverage report
- `npm run dc:up`: Start the stack with Docker Compose
- `npm run dc:down`: Stop the stack with Docker Compose
