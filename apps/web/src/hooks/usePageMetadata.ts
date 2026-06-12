import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type PageMetadata = {
  title: string;
  description?: string;
};

function ensureMetaDescription(): HTMLMetaElement {
  const existing = document.querySelector('meta[name="description"]');
  if (existing instanceof HTMLMetaElement) {
    return existing;
  }

  const meta = document.createElement('meta');
  meta.name = 'description';
  document.head.appendChild(meta);
  return meta;
}

export function usePageMetadata({ title, description }: PageMetadata): void {
  const { t } = useTranslation();

  useEffect(() => {
    const appName = t('common.appName');
    const previousTitle = document.title;
    document.title = t('meta.pageTitle', { title, appName });

    const meta = ensureMetaDescription();
    const previousDescription = meta.content;
    meta.content = description ?? t('meta.defaultDescription');

    return () => {
      document.title = previousTitle;
      meta.content = previousDescription;
    };
  }, [description, t, title]);
}
