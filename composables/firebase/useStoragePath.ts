export const useStoragePath = () => {
  const sample = (id: string) => {
    return `sample/${id}`;
  };

  const aiFilePath = (uid: string, aid: string, fid: string) => {
    return `users/${uid}/ai/${aid}/files/${fid}`;
  };

  return {
    sample,
    aiFilePath,
  };
};
