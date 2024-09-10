import { useCallback, useEffect } from 'react';

const useDisableScrollOnDrag = (isDragging) => {
  const disableBodyScroll = useCallback(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';
  }, []);

  const enableBodyScroll = useCallback(() => {
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }

    return () => {
      enableBodyScroll();
    };
  }, [isDragging, disableBodyScroll, enableBodyScroll]);

  return { disableBodyScroll, enableBodyScroll };
};

export default useDisableScrollOnDrag;