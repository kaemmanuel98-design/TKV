import React, { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronRight, Home, MapPin } from 'lucide-react';
import ProfileAvatar from '../ProfileAvatar';
import { groupMembersByCity } from '../../lib/kingdomPlacements';

export default function KingdomTree({ members, t, onSelectCountry, onSelectCity, onSelectHouse, activeMemberId }) {
  const countries = useMemo(() => {
    const byKey = new Map();
    for (const m of members) {
      if (!m.countryKey) continue;
      const bucket = byKey.get(m.countryKey) || {
        countryKey: m.countryKey,
        country: m.country,
        members: [],
      };
      bucket.members.push(m);
      byKey.set(m.countryKey, bucket);
    }
    return [...byKey.values()].map((group) => ({
      ...group,
      cities: groupMembersByCity(group.members, group.countryKey),
    }));
  }, [members]);

  const [openCountries, setOpenCountries] = useState(() => new Set());
  const [openCities, setOpenCities] = useState(() => new Set());
  const [didAutoOpen, setDidAutoOpen] = useState(false);

  useEffect(() => {
    if (didAutoOpen || !countries.length) return;
    setOpenCountries(new Set(countries.map((c) => c.countryKey)));
    setOpenCities(new Set(countries.flatMap((c) => c.cities.map((city) => city.cityId))));
    setDidAutoOpen(true);
  }, [countries, didAutoOpen]);

  const toggleCountry = (key) => {
    setOpenCountries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCity = (id) => {
    setOpenCities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!countries.length) return null;

  return (
    <section className="kingdom-tree kingdom-glass-card" aria-label={t('map_tree_title')}>
      <h3 className="kingdom-tree-title">
        <MapPin size={16} /> {t('map_tree_title')}
      </h3>
      <ul className="kingdom-tree-root">
        {countries.map((country) => {
          const countryOpen = openCountries.has(country.countryKey);
          return (
            <li key={country.countryKey} className="kingdom-tree-country">
              <div className="kingdom-tree-row">
                <button
                  type="button"
                  className="kingdom-tree-toggle"
                  onClick={() => toggleCountry(country.countryKey)}
                  aria-expanded={countryOpen}
                >
                  {countryOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <button
                  type="button"
                  className="kingdom-tree-label kingdom-tree-label--country"
                  onClick={() => {
                    onSelectCountry({
                      countryKey: country.countryKey,
                      country: country.country,
                      members: country.members,
                    });
                    toggleCountry(country.countryKey);
                  }}
                >
                  <MapPin size={14} />
                  {country.country}
                  <span className="kingdom-tree-badge">{country.members.length}</span>
                </button>
              </div>
              {countryOpen && (
                <ul className="kingdom-tree-cities">
                  {country.cities.map((city) => {
                    const cityOpen = openCities.has(city.cityId);
                    return (
                      <li key={city.cityId}>
                        <div className="kingdom-tree-row kingdom-tree-row--city">
                          <button
                            type="button"
                            className="kingdom-tree-toggle"
                            onClick={() => toggleCity(city.cityId)}
                            aria-expanded={cityOpen}
                          >
                            {cityOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <button
                            type="button"
                            className="kingdom-tree-label kingdom-tree-label--city"
                            onClick={() => {
                              onSelectCity(city, country);
                              toggleCity(city.cityId);
                            }}
                          >
                            <Building2 size={14} />
                            {city.cityName}
                            <span className="kingdom-tree-badge">{city.members.length}</span>
                          </button>
                        </div>
                        {cityOpen && (
                          <ul className="kingdom-tree-houses">
                            {city.members.map((member) => (
                              <li key={member.id}>
                                <button
                                  type="button"
                                  className={`kingdom-tree-house ${activeMemberId === member.id ? 'active' : ''}`}
                                  onClick={() => onSelectHouse(member)}
                                >
                                  <ProfileAvatar src={member.avatarUrl} name={member.name} size={28} />
                                  <Home size={14} />
                                  {member.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
