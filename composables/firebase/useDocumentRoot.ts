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
  
  
  const sectionDocRoot = {
    collection: () => {
      return `section`;
    },
    document: (id: string) => {
      return `section/${id}`;
    },
  };
  
  
  const teamDocRoot = {
    collection: () => {
      return `team`;
    },
    document: (id: string) => {
      return `team/${id}`;
    },
  };
  
  
  const wikiArticleDocRoot = {
    collection: () => {
      return `wikiArticles`;
    },
    document: (id: string) => {
      return `wikiArticles/${id}`;
    },
  };

  return {
    userProfileRoot,
    generalDocRoot,
    facilityDocRoot,
    equipmentDocRoot,
    sectionDocRoot,
    teamDocRoot,
    wikiArticleDocRoot,
  };
};
