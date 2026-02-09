
export enum UserRole {
    ADMIN = "ADMIN",
    BRANCH_HEAD = "BRANCH_HEAD",
    TRAINER = "TRAINER",
    STUDENT = "STUDENT",
    CEO = "CEO"
}

export enum LeadStatus {
    NEW = "NEW",
    CONTACTED = "CONTACTED",
    QUALIFIED = "QUALIFIED",
    NEGOTIATING = "NEGOTIATING",
    CONVERTED = "CONVERTED",
    LOST = "LOST"
}

export enum LeadSource {
    WEBSITE = "WEBSITE",
    PHONE = "PHONE",
    WALK_IN = "WALK_IN",
    REFERRAL = "REFERRAL",
    SOCIAL_MEDIA = "SOCIAL_MEDIA",
    ADVERTISEMENT = "ADVERTISEMENT",
    OTHER = "OTHER"
}

export enum AdmissionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}

export enum AttendanceStatus {
    PRESENT = "PRESENT",
    ABSENT = "ABSENT",
    LATE = "LATE",
    EXCUSED = "EXCUSED"
}

export enum PlacementStatus {
    NOT_ELIGIBLE = "NOT_ELIGIBLE",
    ELIGIBLE = "ELIGIBLE",
    APPLIED = "APPLIED",
    SHORTLISTED = "SHORTLISTED",
    INTERVIEWED = "INTERVIEWED",
    OFFERED = "OFFERED",
    PLACED = "PLACED",
    REJECTED = "REJECTED"
}

export enum IncentiveType {
    ADMISSION = "ADMISSION",
    PLACEMENT = "PLACEMENT",
    PERFORMANCE = "PERFORMANCE",
    BONUS = "BONUS"
}
