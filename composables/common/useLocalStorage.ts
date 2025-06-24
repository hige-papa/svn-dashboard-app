export const useLocalStorage = (name: string) => {
    const storage = localStorage;

    const data = JSON.parse(storage.getItem(name) || '{}');

    const getItem = (key: string) => {
        return storage.getItem(key);
    };

    const setItem = (key: string, value: string) => {
        storage[key] = value;
    };

    const save = () => {
        storage.setItem(name, JSON.stringify(data));
    };

    return {
        data,
        getItem,
        setItem,
        save,
    }
};