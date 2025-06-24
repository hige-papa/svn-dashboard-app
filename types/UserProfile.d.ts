interface UserProfile {
  uid: string;
  displayName: string;
  displayNameEng: string;
  color: string;
}

interface ExtendedUserProfile extends UserProfile {
  email?: string;
  phone?: string;
  department?: string;
  role?: 'admin' | 'user' | 'viewer';
  status?: 'active' | 'inactive';
  bio?: string;
  avatar?: string;
  notifications?: {
    email: boolean;
    calendar: boolean;
    system: boolean;
  };
  lastLogin?: string | Date | Timestamp;
  createdAt?: string | Date | Timestamp;
  updatedAt?: string | Date | Timestamp;

  // 貸与備品を追加する ※複数を想定

  // 所属 ※
}