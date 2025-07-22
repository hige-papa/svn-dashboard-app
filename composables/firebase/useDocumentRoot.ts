export const useDocumentRoot = () => {
  const userProfileRoot = {
    collection: () => {
      return "users";
    },
    document: (uid: string) => {
      return `users/${uid}`;
    },
  };
  
  
  const generalDocRoot = {
    collection: (key: string) => {
      return `${key}`;
    },
    document: (key: string, id: string) => {
      return `${key}/${id}`;
    },
  };
  
  
  const facilityDocRoot = {
    collection: () => {
      return `facility`;
    },
    document: (id: string) => {
      return `facility/${id}`;
    },
  };
  
  
  const equipmentDocRoot = {
    collection: () => {
      return `equipment`;
    },
    document: (id: string) => {
      return `equipment/${id}`;
    },
  };

  return {
    userProfileRoot,
    generalDocRoot,
    facilityDocRoot,
    equipmentDocRoot,
  };
};
