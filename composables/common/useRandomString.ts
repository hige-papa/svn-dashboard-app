export const useRandomString = () => {
    const generateRandomString = (digit: number) => {
        const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < digit; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
      
        return result;
    }

    return {
        generateRandomString
    }
}