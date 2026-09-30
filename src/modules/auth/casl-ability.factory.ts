import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

export type Action =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve';

export type Subjects =
  | 'Property'
  | 'Inspection'
  | 'Issue'
  | 'Repair'
  | 'User'
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

export interface CaslUser {
  id: string;
  role: Role;
  email?: string;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: CaslUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    switch (user.role) {
      case Role.ADMIN:
        // ADMIN can manage all entities
        can('manage', 'all');
        break;

      case Role.OWNER:
        // OWNER can create/read their own Properties, read Inspections, and approve Issues
        can('create', 'Property');
        can('read', 'Property');
        can('read', 'Inspection');
        can('approve', 'Issue');
        can('read', 'User');
        break;

      case Role.INSPECTOR:
        // INSPECTOR can read/update assigned Inspections and create Issues
        can('read', 'Inspection');
        can('update', 'Inspection');
        can('create', 'Issue');
        can('read', 'Property');
        break;

      case Role.PROVIDER:
        // PROVIDER can read/update assigned Repairs
        can('read', 'Repair');
        can('update', 'Repair');
        can('read', 'Issue');
        break;

      default:
        break;
    }

    return build();
  }
}
