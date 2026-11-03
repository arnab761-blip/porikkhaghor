export interface UserAccessData {
  hasPaidAccess?: boolean;
  unlockedPackages?: string[];
  unlockedExams?: string[];
  unlockedResources?: string[];
  role?: string;
}

export interface PackageAccessItem {
  id: string;
  includedExams?: string[];
  includedResources?: string[];
}

/**
 * Checks if a course package is unlocked for a user.
 */
export function isPackageUnlocked(pkgId: string, userData?: UserAccessData | null): boolean {
  if (!userData) return false;
  if (userData.hasPaidAccess) return true; // VIP full-platform access
  return Array.isArray(userData.unlockedPackages) && userData.unlockedPackages.includes(pkgId);
}

/**
 * Checks if an exam is unlocked for a user.
 * An exam is accessible if:
 * 1. It is free (!exam.isPaid)
 * 2. User has VIP full-platform access (userData.hasPaidAccess)
 * 3. User has this specific exam unlocked directly (userData.unlockedExams)
 * 4. User owns a package that includes this exam in pkg.includedExams
 */
export function isExamUnlocked(
  exam: { id: string; isPaid?: boolean },
  userData?: UserAccessData | null,
  packagesList?: PackageAccessItem[]
): boolean {
  if (!exam?.isPaid) return true;
  if (!userData) return false;
  if (userData.hasPaidAccess) return true;

  if (Array.isArray(userData.unlockedExams) && userData.unlockedExams.includes(exam.id)) {
    return true;
  }

  if (packagesList && Array.isArray(userData.unlockedPackages) && userData.unlockedPackages.length > 0) {
    const userOwnedPkgSet = new Set(userData.unlockedPackages);
    const inOwnedPkg = packagesList.some(pkg => 
      userOwnedPkgSet.has(pkg.id) && Array.isArray(pkg.includedExams) && pkg.includedExams.includes(exam.id)
    );
    if (inOwnedPkg) return true;
  }

  return false;
}

/**
 * Checks if a resource/sheet is unlocked for a user.
 * A resource is accessible if:
 * 1. It is free (!resource.isPaid)
 * 2. User has VIP full-platform access (userData.hasPaidAccess)
 * 3. User has this specific resource unlocked directly (userData.unlockedResources)
 * 4. User owns a package that includes this resource in pkg.includedResources
 */
export function isResourceUnlocked(
  resource: { id: string; isPaid?: boolean },
  userData?: UserAccessData | null,
  packagesList?: PackageAccessItem[]
): boolean {
  if (!resource?.isPaid) return true;
  if (!userData) return false;
  if (userData.hasPaidAccess) return true;

  if (Array.isArray(userData.unlockedResources) && userData.unlockedResources.includes(resource.id)) {
    return true;
  }

  if (packagesList && Array.isArray(userData.unlockedPackages) && userData.unlockedPackages.length > 0) {
    const userOwnedPkgSet = new Set(userData.unlockedPackages);
    const inOwnedPkg = packagesList.some(pkg => 
      userOwnedPkgSet.has(pkg.id) && Array.isArray(pkg.includedResources) && pkg.includedResources.includes(resource.id)
    );
    if (inOwnedPkg) return true;
  }

  return false;
}
