import React from 'react';
import { Building2, Home, MapPin } from 'lucide-react';
import ProfileAvatar from '../ProfileAvatar';

export default function KingdomExplorer({
  level,
  countryGroups,
  cityGroups,
  cityMembers,
  t,
  onSelectCountry,
  onSelectCity,
  onSelectHouse,
}) {
  if (level === 'world' && countryGroups.length > 0) {
    return (
      <section className="kingdom-explorer card" aria-label={t('map_explore_countries')}>
        <h3 className="kingdom-explorer-title">
          <MapPin size={16} /> {t('map_explore_countries')}
        </h3>
        <ul className="kingdom-explorer-list">
          {countryGroups.map((group) => (
            <li key={group.countryKey}>
              <button type="button" className="kingdom-explorer-item" onClick={() => onSelectCountry(group)}>
                <span className="kingdom-explorer-item__label">{group.country}</span>
                <span className="kingdom-explorer-item__meta">
                  {t('map_country_members', { count: group.members.length })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (level === 'country' && cityGroups.length > 0) {
    return (
      <section className="kingdom-explorer card" aria-label={t('map_explore_cities')}>
        <h3 className="kingdom-explorer-title">
          <Building2 size={16} /> {t('map_explore_cities')}
        </h3>
        <ul className="kingdom-explorer-list">
          {cityGroups.map((city) => (
            <li key={city.cityId}>
              <button type="button" className="kingdom-explorer-item" onClick={() => onSelectCity(city)}>
                <span className="kingdom-explorer-item__label">{city.cityName}</span>
                <span className="kingdom-explorer-item__meta">
                  {t('map_city_members', { count: city.members.length })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (level === 'country' && cityGroups.length === 0) {
    return (
      <p className="text-muted map-status kingdom-explorer-empty">{t('map_cities_empty')}</p>
    );
  }

  if (level === 'city' && cityMembers.length > 0) {
    return (
      <section className="kingdom-explorer card" aria-label={t('map_explore_houses')}>
        <h3 className="kingdom-explorer-title">
          <Home size={16} /> {t('map_explore_houses')}
        </h3>
        <ul className="kingdom-explorer-list kingdom-explorer-list--houses">
          {cityMembers.map((member) => (
            <li key={member.id}>
              <button type="button" className="kingdom-explorer-item kingdom-explorer-item--house" onClick={() => onSelectHouse(member)}>
                <ProfileAvatar src={member.avatarUrl} name={member.name} size={32} />
                <span className="kingdom-explorer-item__label">{member.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (level === 'city' && cityMembers.length === 0) {
    return (
      <p className="text-muted map-status kingdom-explorer-empty">{t('map_houses_empty')}</p>
    );
  }

  return null;
}
