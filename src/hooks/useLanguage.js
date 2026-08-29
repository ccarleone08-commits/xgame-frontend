import { useAppContext } from '../context/AppContext';

export function useLanguage() {
  const { language, setAppLanguage, t } = useAppContext();
  return { language, setLanguage: setAppLanguage, t };
}

export default useLanguage;
