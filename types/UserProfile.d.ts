interface UserProfile {
  uid: string;
  displayName: string;
  displayNameEng: string;
  color: string;
}

interface ExtendedUserProfile extends UserProfile {
  code: string;
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
  visible: boolean;
  lastLogin?: string | Date | Timestamp;
  createdAt?: string | Date | Timestamp;
  updatedAt?: string | Date | Timestamp;

  // 貸与備品を追加する ※複数を想定

  // 所属 ※
}

interface UserFormData {
  code: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  department: string;
  role: 'admin' | 'user' | 'viewer' | '';
  status: 'active' | 'inactive';
  bio: string;
  avatar: string;
  notifications: {
    email: boolean;
    calendar: boolean;
    system: boolean;
  }
}

interface UserFormErrors {
  code?: string;
  name?: string;
  email?: string;
  password?: string;
  department?: string;
  role?: string;
}

interface UserView {
  id: string;
  code: string;
  name: string;
  email: string;
  department: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}