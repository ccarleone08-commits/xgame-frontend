import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';
import { useAppContext } from '../../context/AppContext';

const NotFound = () => {
  const { t } = useAppContext();

  return (
    <section className="notfound">
      <div className="notfound__card">
        <div className="notfound__badge">{t('not_found_tag')}</div>
        <div className="notfound__code" aria-hidden="true">
          404
        </div>
        <h1 className="notfound__title">{t('not_found_title')}</h1>
        <p className="notfound__subtitle">{t('not_found_subtitle')}</p>
        <p className="notfound__copy">{t('not_found_copy')}</p>
        <div className="notfound__actions">
          <Link to="/" className="notfound__btn">
            {t('back_home')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
