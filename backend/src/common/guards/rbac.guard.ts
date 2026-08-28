import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../database/enums';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se nenhuma role foi explicitamente exigida, permite o acesso aos usuários autenticados
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException(
        'Acesso negado: Perfil do usuário não identificado.',
      );
    }

    // ADMIN_GERAL possui permissão administrativa total em conformidade com a Matriz RBAC
    if (user.role === UserRole.ADMIN_GERAL) {
      return true;
    }

    const hasPermission = requiredRoles.includes(user.role as UserRole);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Acesso negado: O perfil '${user.role}' não possui permissão para este recurso. Perfis autorizados: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
