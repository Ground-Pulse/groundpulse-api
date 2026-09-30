import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

export type Subjects =
  | 'Property'
  | 'Inspection'
  | 'Issue'
  | 'Repair'
  | 'User'
  | 'Notification'
  | 'AuditLog'
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
        can('manage', 'all');
        break;

      case Role.OWNER:
        can('create', 'Property');
        can('read', 'Property');
        can('update', 'Property');
        can('delete', 'Property');
        can('read', 'Inspection');
        can('read', 'Issue');
        can('update', 'Issue'); // for approving/rejecting issues
        can('read', 'Repair');
        can('read', 'Notification');
        can('read', 'User');
        break;

      case Role.INSPECTOR:
        can('read', 'Property');
        can('read', 'Inspection');
        can('update', 'Inspection');
        can('create', 'Issue');
        can('read', 'Issue');
        can('read', 'Notification');
        can('read', 'User');
        break;

      case Role.PROVIDER:
        can('read', 'Property');
        can('read', 'Issue');
        can('read', 'Repair');
        can('update', 'Repair');
        can('read', 'Notification');
        can('read', 'User');
        break;

      default:
        break;
    }

    return build();
  }
}
