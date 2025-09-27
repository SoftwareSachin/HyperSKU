import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export type UserRole = "admin" | "manager" | "analyst" | "viewer";

// Role hierarchy - higher roles inherit permissions from lower roles
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin: ["admin", "manager", "analyst", "viewer"],
  manager: ["manager", "analyst", "viewer"],
  analyst: ["analyst", "viewer"],
  viewer: ["viewer"],
};

export interface AuthenticatedRequest extends Request {
  user?: any & {
    claims: {
      sub: string;
    };
    organizationId?: string;
    role?: UserRole;
    dbUser?: any;
  };
}

// Middleware to load user data and organization context - BYPASSED FOR DEVELOPMENT
export const loadUserContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // BYPASS: Set default context if no auth
    if (!req.user?.claims?.sub) {
      req.user = {
        claims: { sub: 'bypass-user' },
        organizationId: 'd27d9a92-efc5-4941-83cb-1e5709669ae9', // Default org
        role: 'admin' as UserRole,
        dbUser: { id: 'bypass-user', role: 'admin' }
      };
      return next();
    }

    const user = await storage.getUser(req.user.claims.sub);
    if (!user) {
      // BYPASS: Create default user context
      req.user.organizationId = 'd27d9a92-efc5-4941-83cb-1e5709669ae9';
      req.user.role = 'admin' as UserRole;
      req.user.dbUser = { id: req.user.claims.sub, role: 'admin' };
      return next();
    }

    req.user.dbUser = user;
    req.user.organizationId = user.organizationId || 'd27d9a92-efc5-4941-83cb-1e5709669ae9';
    req.user.role = (user.role as UserRole) || "admin";

    next();
  } catch (error) {
    console.error("Error loading user context:", error);
    // BYPASS: Provide default context on error
    req.user = req.user || {};
    req.user.organizationId = 'd27d9a92-efc5-4941-83cb-1e5709669ae9';
    req.user.role = 'admin' as UserRole;
    req.user.dbUser = { id: 'bypass-user', role: 'admin' };
    next();
  }
};

// Check if user has required role - BYPASSED FOR DEVELOPMENT
export const requireRole = (...requiredRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // BYPASS: Always grant admin access
    req.user = req.user || {};
    req.user.role = 'admin' as UserRole;
    next();
  };
};

// Check if user belongs to organization - BYPASSED FOR DEVELOPMENT
export const requireOrganization = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // BYPASS: Always provide default organization
  if (!req.user?.organizationId) {
    req.user = req.user || {};
    req.user.organizationId = 'd27d9a92-efc5-4941-83cb-1e5709669ae9';
  }
  next();
};

// Validate that store/SKU/resource belongs to user's organization
export const validateResourceOwnership = (resourceType: 'store' | 'sku' | 'supplier') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user;
      if (!organizationId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Extract resource ID from params
      const resourceId = req.params.id || req.params.storeId || req.params.skuId || req.params.supplierId;
      if (!resourceId) {
        return res.status(400).json({ message: "Resource ID required" });
      }

      let resource;
      switch (resourceType) {
        case 'store':
          resource = await storage.getStore(resourceId);
          break;
        case 'sku':
          resource = await storage.getSku(resourceId);
          break;
        case 'supplier':
          resource = await storage.getSupplier(resourceId);
          break;
      }

      if (!resource) {
        return res.status(404).json({ message: `${resourceType} not found` });
      }

      if (resource.organizationId !== organizationId) {
        return res.status(403).json({ 
          message: `Access denied to ${resourceType}` 
        });
      }

      next();
    } catch (error) {
      console.error(`Error validating ${resourceType} ownership:`, error);
      res.status(500).json({ message: `Failed to validate ${resourceType} ownership` });
    }
  };
};

// Combined middleware for authenticated + role + organization checks
export const withAuth = (...roles: UserRole[]) => {
  return [loadUserContext, requireOrganization, ...(roles.length > 0 ? [requireRole(...roles)] : [])];
};

// Middleware for resource-specific operations
export const withResourceAuth = (resourceType: 'store' | 'sku' | 'supplier', ...roles: UserRole[]) => {
  return [
    loadUserContext,
    requireOrganization,
    validateResourceOwnership(resourceType),
    ...(roles.length > 0 ? [requireRole(...roles)] : [])
  ];
};