# Database Entity-Relationship Diagram

```mermaid
erDiagram
    operators ||--o{ users : "has"
    operators ||--o{ roles : "has"
    operators ||--o{ drivers : "has"
    operators ||--o{ vehicles : "has"
    operators ||--o{ clients : "has"
    operators ||--o{ providers : "has"
    operators ||--o{ routes : "has"
    operators ||--o{ operations : "has"
    operators ||--o{ auditLog : "tracks"

    roles ||--o{ users : "assigned to"
    roles ||--o{ roleGrants : "has"

    grants ||--o{ roleGrants : "granted via"

    users ||--o{ auditLog : "performs"

    drivers ||--o{ driverDocuments : "has"
    drivers ||--o{ driverVehicles : "assigned to"
    drivers ||--o{ operations : "performs"

    vehicles ||--o{ driverVehicles : "assigned to"
    vehicles ||--o{ vehicleDocuments : "has"
    vehicles ||--o{ operations : "used in"

    clients ||--o{ operations : "requests"
    providers ||--o{ operations : "provides"
    routes ||--o{ operations : "follows"

    operators {
        int id PK
        varchar name
        varchar rut UK
        boolean super
        timestamp expiration
        boolean status
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    roles {
        int id PK
        varchar name
        int operator_id FK
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    grants {
        int id PK
        varchar resource
        varchar action
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    roleGrants {
        int role_id FK
        int grant_id FK
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    users {
        int id PK
        varchar username UK
        varchar email UK
        varchar password
        varchar first_name
        varchar last_name
        boolean status
        timestamp last_activity_at
        int operator_id FK
        int role_id FK
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    auditLog {
        int id PK
        int user_id FK
        int operator_id FK
        varchar action
        varchar resource
        int resource_id
        varchar details
        varchar ip_address
        varchar user_agent
        timestamp created_at
    }

    drivers {
        int id PK
        int operator_id FK
        varchar rut
        varchar first_name
        varchar last_name
        varchar email
        varchar phone
        varchar emergency_contact_name
        varchar emergency_contact_phone
        varchar license_type
        varchar license_number
        timestamp license_expiration_date
        timestamp date_of_birth
        varchar address
        varchar city
        varchar region
        boolean status
        boolean is_external
        varchar external_company
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    driverDocuments {
        int id PK
        int driver_id FK
        varchar document_type
        varchar document_name
        varchar file_name
        varchar file_path
        int file_size
        varchar mime_type
        timestamp issue_date
        timestamp expiration_date
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    vehicles {
        int id PK
        int operator_id FK
        varchar plate_number
        varchar brand
        varchar model
        int year
        varchar vehicle_type
        int capacity
        varchar capacity_unit
        varchar vin
        varchar color
        boolean status
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    driverVehicles {
        int id PK
        int driver_id FK
        int vehicle_id FK
        timestamp assigned_at
        timestamp unassigned_at
        boolean is_active
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    vehicleDocuments {
        int id PK
        int vehicle_id FK
        varchar document_type
        varchar document_name
        varchar file_name
        varchar file_path
        int file_size
        varchar mime_type
        timestamp issue_date
        timestamp expiration_date
        varchar insurance_company
        varchar policy_number
        int coverage_amount
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    clients {
        int id PK
        int operator_id FK
        varchar business_name
        varchar tax_id
        varchar contact_name
        varchar contact_email
        varchar contact_phone
        varchar address
        varchar city
        varchar region
        varchar country
        varchar industry
        boolean status
        varchar observations
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    providers {
        int id PK
        int operator_id FK
        varchar business_name
        varchar tax_id
        varchar contact_name
        varchar contact_email
        varchar contact_phone
        varchar address
        varchar city
        varchar region
        varchar country
        varchar business_type
        varchar service_types
        int fleet_size
        boolean status
        int rating
        varchar observations
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    routes {
        int id PK
        int operator_id FK
        varchar name
        varchar code
        varchar origin
        varchar destination
        int distance
        int estimated_duration
        varchar route_type
        varchar difficulty
        varchar road_conditions
        boolean tolls_required
        int estimated_toll_cost
        boolean status
        varchar observations
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }

    operations {
        int id PK
        int operator_id FK
        int client_id FK
        int provider_id FK
        int route_id FK
        int driver_id FK
        int vehicle_id FK
        varchar operation_number UK
        varchar operation_type
        varchar origin
        varchar destination
        timestamp scheduled_start_date
        timestamp scheduled_end_date
        timestamp actual_start_date
        timestamp actual_end_date
        int distance
        varchar status
        varchar cargo_description
        int cargo_weight
        varchar notes
        timestamp created_at
        timestamp updated_at
        int created_by
        int updated_by
    }
```

## Schema Overview

This database schema is designed for a **multi-tenant logistics and transport management system**. The key components are:

### Core Entities

1. **Operators** - The top-level tenant/organization entity
2. **Users** - System users with role-based access control
3. **Roles & Grants** - RBAC system for permissions management

### Operational Entities

4. **Drivers** - Driver management with licensing and documentation
5. **Vehicles** - Fleet management with documentation
6. **Clients** - Customer/client management
7. **Providers** - External transport provider management
8. **Routes** - Route/segment definitions
9. **Operations** - Core business operations/trips

### Supporting Entities

10. **Driver Documents** - Driver-related documentation storage
11. **Vehicle Documents** - Vehicle-related documentation storage
12. **Driver-Vehicle Assignments** - Many-to-many relationship tracking
13. **Audit Log** - System activity tracking

### Key Features

- **Multi-tenancy**: All entities are scoped to an `operator_id`
- **RBAC**: Role-based access control with granular permissions via grants
- **Document Management**: Comprehensive document tracking for drivers and vehicles
- **Audit Trail**: Complete activity logging for compliance
- **Fleet Management**: Driver-vehicle assignment tracking with history
- **Operations Tracking**: End-to-end trip/operation management

### Relationships

- Each **Operator** can have multiple users, drivers, vehicles, clients, providers, routes, and operations
- **Users** are assigned to a single role within their operator
- **Roles** have multiple grants (permissions) through a junction table
- **Drivers** and **Vehicles** can be assigned to each other (many-to-many)
- **Operations** connect drivers, vehicles, clients, providers, and routes
