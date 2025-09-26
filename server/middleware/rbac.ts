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

// Middleware to load user data and organization context
export const loadUserContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.user.claims.sub);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user.dbUser = user;
    req.user.organizationId = user.organizationId || undefined;
    req.user.role = (user.role as UserRole) || "viewer";

    next();
  } catch (error) {
    console.error("Error loading user context:", error);
    res.status(500).json({ message: "Failed to load user context" });
  }
};

// Check if user has required role
export const requireRole = (...requiredRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({ message: "User role not found" });
    }

    const userPermissions = ROLE_HIERARCHY[userRole as UserRole];
    const hasPermission = requiredRoles.some(role => 
      userPermissions.includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${requiredRoles.join(", ")}` 
      });
    }

    next();
  };
};

// Check if user belongs to organization
export const requireOrganization = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.organizationId) {
    return res.status(400).json({ 
      message: "User not associated with organization" 
    });
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