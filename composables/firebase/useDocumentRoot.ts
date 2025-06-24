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

  return {
    userProfileRoot,
    generalDocRoot,
  };
};
