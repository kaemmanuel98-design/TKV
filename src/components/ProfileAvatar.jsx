import React, { useRef } from 'react';
import { Camera, User } from 'lucide-react';
import './ProfileAvatar.css';

/**
 * @param {{ src?: string | null, name?: string, size?: number, editable?: boolean, uploading?: boolean, onPickFile?: (file: File) => void, className?: string }} props
 */
const ProfileAvatar = ({
  src,
  name = '',
  size = 96,
  editable = false,
  uploading = false,
  onPickFile,
  className = '',
}) => {
  const inputRef = useRef(null);
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onPickFile) onPickFile(file);
    e.target.value = '';
  };

  return (
    <div
      className={`profile-avatar ${editable ? 'profile-avatar--editable' : ''} ${className}`.trim()}
      style={{ '--avatar-size': `${size}px` }}
    >
      <div className="profile-avatar__ring">
        {src ? (
          <img src={src} alt="" className="profile-avatar__img" width={size} height={size} />
        ) : (
          <span className="profile-avatar__initial" aria-hidden>
            {initial}
          </span>
        )}
        {!src && !editable && (
          <User className="profile-avatar__fallback-icon" size={size * 0.4} strokeWidth={1.25} />
        )}
        {uploading && <span className="profile-avatar__loading" aria-hidden />}
      </div>
      {editable && (
        <>
          <button
            type="button"
            className="profile-avatar__edit-btn"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
          >
            <Camera size={18} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="profile-avatar__file-input"
            onChange={handleChange}
          />
        </>
      )}
    </div>
  );
};

export default ProfileAvatar;
