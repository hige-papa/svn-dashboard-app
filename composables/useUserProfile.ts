import type { UserInfo } from 'firebase/auth';
import { where, orderBy, limit, QueryConstraint, Timestamp } from 'firebase/firestore';
import { useAuth } from '~/composables/firebase/useAuth';
import { useMaster } from '~/composables/master/useMaster';


// カラーパレット
const USER_COLORS = [
  '#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED',
  '#0891B2', '#EA580C', '#BE185D', '#059669', '#7C2D12'
];

export const useUserProfile = () => {
  const { createUserWithEmailAndPasswordAsync, updateUserAsync } = useAuth();
  const { addAsync, addWithIdAsync, getAsync, getListAsync, updateAsync, deleteAsync } = useMaster('users');

  /**
   * ランダムなカラーを取得
   */
  const getRandomColor = (): string => {
    return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  };

  /**
   * ユーザーをFirebase AuthenticationとFirestoreに作成
   */
  const createUserProfile = async (
    email: string,
    password: string,
    profileData: Omit<ExtendedUserProfile, 'uid' | 'email'>
  ): Promise<ExtendedUserProfile | null> => {
    try {
      // Firebase Authenticationでユーザー作成
      const authUser = await createUserWithEmailAndPasswordAsync(email, password);
      
      if (!authUser) {
        throw new Error('Failed to create user with Firebase Authentication');
      }

      // Authentication側のプロフィール更新
      await updateUserAsync({
        displayName: profileData.displayName,
        photoURL: profileData.avatar || null
      } as UserInfo);

      // Firestoreのユーザープロフィール作成
      const userProfile: any = {
        uid: authUser.uid,
        email: email,
        displayName: profileData.displayName,
        displayNameEng: profileData.displayNameEng,
        color: profileData.color || getRandomColor(),
        phone: profileData.phone || '',
        department: profileData.department || '',
        role: profileData.role || 'user',
        status: profileData.status || 'active',
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
        notifications: profileData.notifications || {
          email: true,
          calendar: true,
          system: false
        }
      };

      // useMasterを使用してFirestoreにユーザープロフィールを保存
      const savedProfile = await addWithIdAsync(authUser.uid, userProfile);

      if (!savedProfile) {
        throw new Error('Failed to save user profile to Firestore');
      }

      console.log('User profile created successfully:', savedProfile);
      
      return {
        uid: savedProfile.uid,
        displayName: savedProfile.displayName,
        displayNameEng: savedProfile.displayNameEng,
        color: savedProfile.color
      };

    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  /**
   * ユーザープロフィールを取得
   */
  const getUserProfile = async (uid: string): Promise<ExtendedUserProfile | null> => {
    try {
      const userProfile = await getAsync(uid);
      
      if (userProfile) {
        return userProfile as ExtendedUserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  };

  /**
   * ユーザープロフィールを更新
   */
  const updateUserProfile = async (
    uid: string,
    updates: Partial<Omit<ExtendedUserProfile, 'uid' | 'createdAt'>>
  ): Promise<void> => {
    try {
      await updateAsync(uid, updates);

      // Authenticationのプロフィールも更新（displayNameやavatarが変更された場合）
      if (updates.displayName || updates.avatar !== undefined) {
        await updateUserAsync({
          displayName: updates.displayName,
          photoURL: updates.avatar || null
        } as UserInfo);
      }

      console.log('User profile updated successfully:', uid);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  /**
   * ユーザープロフィールを削除
   */
  const deleteUserProfile = async (uid: string): Promise<void> => {
    try {
      await deleteAsync(uid);
      
      console.log('User profile deleted successfully:', uid);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  };

  /**
   * 全ユーザープロフィールを取得
   */
  const getAllUserProfiles = async (
    limitCount?: number
  ): Promise<ExtendedUserProfile[]> => {
    try {
      const constraints = [orderBy('createdAt', 'desc')] as QueryConstraint[];
      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const users = await getListAsync(...constraints);
      return users as ExtendedUserProfile[];
    } catch (error) {
      console.error('Error getting all user profiles:', error);
      throw error;
    }
  };

  /**
   * アクティブなユーザープロフィールを取得
   */
  const getActiveUserProfiles = async (): Promise<ExtendedUserProfile[]> => {
    try {
      const users = await getListAsync(
        where('status', '==', 'active'),
        orderBy('displayName', 'asc')
      );
      
      return users as ExtendedUserProfile[];
    } catch (error) {
      console.error('Error getting active user profiles:', error);
      throw error;
    }
  };

  /**
   * 部署別ユーザープロフィールを取得
   */
  const getUserProfilesByDepartment = async (department: string): Promise<ExtendedUserProfile[]> => {
    try {
      const users = await getListAsync(
        where('department', '==', department),
        where('status', '==', 'active'),
        orderBy('displayName', 'asc')
      );
      
      return users as ExtendedUserProfile[];
    } catch (error) {
      console.error('Error getting user profiles by department:', error);
      throw error;
    }
  };

  /**
   * 役割別ユーザープロフィールを取得
   */
  const getUserProfilesByRole = async (role: 'admin' | 'user' | 'viewer'): Promise<ExtendedUserProfile[]> => {
    try {
      const users = await getListAsync(
        where('role', '==', role),
        where('status', '==', 'active'),
        orderBy('displayName', 'asc')
      );
      
      return users as ExtendedUserProfile[];
    } catch (error) {
      console.error('Error getting user profiles by role:', error);
      throw error;
    }
  };

  /**
   * ユーザーを検索
   */
  const searchUserProfiles = async (searchTerm: string): Promise<ExtendedUserProfile[]> => {
    try {
      // Firestoreの制限により、部分一致検索は複雑になるため、
      // 全ユーザーを取得してクライアント側でフィルタリング
      const allUsers = await getActiveUserProfiles();
      
      const searchLower = searchTerm.toLowerCase();
      return allUsers.filter(user => 
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.displayNameEng?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.department?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching user profiles:', error);
      throw error;
    }
  };

  /**
   * ユーザーのステータスを切り替え
   */
  const toggleUserStatus = async (uid: string): Promise<void> => {
    try {
      const userProfile = await getUserProfile(uid);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const newStatus = userProfile.status === 'active' ? 'inactive' : 'active';
      await updateAsync(uid, {
        status: newStatus
      });
      
      console.log('User status toggled successfully:', uid, newStatus);
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  };

  /**
   * 複数ユーザーのプロフィールを一括取得
   */
  const getUserProfilesBatch = async (uids: string[]): Promise<ExtendedUserProfile[]> => {
    try {
      const profiles: ExtendedUserProfile[] = [];
      
      // Firestoreの制限により、バッチで取得する場合は個別に取得
      for (const uid of uids) {
        const profile = await getUserProfile(uid);
        if (profile) {
          profiles.push(profile);
        }
      }
      
      return profiles;
    } catch (error) {
      console.error('Error getting user profiles batch:', error);
      throw error;
    }
  };

  /**
   * 部署統計を取得
   */
  const getDepartmentStats = async (): Promise<{ department: string; count: number }[]> => {
    try {
      const allUsers = await getActiveUserProfiles();
      const departmentCounts: { [key: string]: number } = {};
      
      allUsers.forEach(user => {
        if (user.department) {
          departmentCounts[user.department] = (departmentCounts[user.department] || 0) + 1;
        }
      });
      
      return Object.entries(departmentCounts).map(([department, count]) => ({
        department,
        count
      }));
    } catch (error) {
      console.error('Error getting department stats:', error);
      throw error;
    }
  };

  /**
   * 基本のUserProfile型のみを返すヘルパー関数
   */
  const toBasicUserProfile = (extendedProfile: ExtendedUserProfile): UserProfile => {
    return {
      uid: extendedProfile.uid,
      displayName: extendedProfile.displayName,
      displayNameEng: extendedProfile.displayNameEng,
      color: extendedProfile.color
    };
  };

  return {
    // 基本操作
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,

    // 一覧取得
    getAllUserProfiles,
    getActiveUserProfiles,
    getUserProfilesByDepartment,
    getUserProfilesByRole,
    searchUserProfiles,
    getUserProfilesBatch,

    // 特殊操作
    toggleUserStatus,

    // 統計・分析
    getDepartmentStats,

    // ユーティリティ
    toBasicUserProfile,
    getRandomColor,
  };
};