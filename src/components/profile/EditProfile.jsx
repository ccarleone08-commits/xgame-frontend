import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
// import { User, Palette, Download, RotateCcw, Upload, Grid3x3 } from 'lucide-react';
import "./EditProfile.css";

const CharacterCreator = ({ onSave, onCancel }) => {
    const [activeMainTab, setActiveMainTab] = useState('gallery');
    const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [character, setCharacter] = useState({
        gender: 'man',
        hairColor: 'black'
    });

    const characterRef = useRef(null);
    const fileInputRef = useRef(null);

    const galleryImages = [
        { id: 1, name: '1', src: '/assets/gallery/profilePhoto.png' },
        { id: 2, name: '2', src: '/assets/gallery/profilePhoto1.png' },
        { id: 3, name: '3', src: '/assets/gallery/profilePhoto2.png' },
        { id: 4, name: '4', src: '/assets/gallery/profilePhoto3.png' },
        { id: 5, name: '5', src: '/assets/gallery/profilePhoto4.png' },
        { id: 6, name: '6', src: '/assets/gallery/profilePhoto5.png' },
    ];

    const hairColors = {
        man: [
            { id: 'black', name: 'color_black', color: '#1a1a1a' },
            { id: 'red', name: 'color_red', color: '#DC143C' },
            { id: 'blondie', name: 'color_blondie', color: '#cbbf0e' },
            { id: 'blue', name: 'color_blue', color: '#4169E1' }
        ],
        woman: [
            { id: 'black', name: 'color_black', color: '#1a1a1a' },
            { id: 'pink', name: 'color_pink', color: '#FF69B4' },
            { id: 'blondie', name: 'color_blondie', color: '#cbbf0e' },
            { id: 'red', name: 'color_red', color: '#DC143C' },
            { id: 'blue', name: 'color_blue', color: '#4169E1' }
        ]
    };

    const { t } = useAppContext();

    const mainTabs = [
        { id: 'gallery', name: t('gallery'), icon: "Grid3x3" },
        { id: 'creator', name: t('design'), icon: "Palette" }
    ];

    const handleTabClick = (id) => {
        if (id === 'creator') {
            setSelectedGalleryImage(null);
        }
        setActiveMainTab(id);
    };

    const updateGender = (gender) => {
        const defaultColor = gender === 'man' ? 'black' : 'pink';
        setCharacter({ gender, hairColor: defaultColor });
    };

    const updateHairColor = (color) => {
        setCharacter(prev => ({ ...prev, hairColor: color }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target.result);
                setSelectedGalleryImage(event.target.result);
                setActiveMainTab('gallery');
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const getCreatorImagePath = () => {
        const genderPrefix = character.gender;
        const hairColorCapitalized = character.hairColor.charAt(0).toUpperCase() + character.hairColor.slice(1);
        return `/assets/characters/${genderPrefix}${hairColorCapitalized}Hair.png`;
    };

    const handleSave = () => {
        // determine profile number and image src
        let profileNo = null;
        let imageSrc = null;

        if (selectedGalleryImage) {
            const idx = galleryImages.findIndex(img => img.src === selectedGalleryImage);
            if (idx >= 0) {
                profileNo = idx + 1; // 1-based gallery indexing
                imageSrc = selectedGalleryImage;
            } else {
                // uploaded data-uri
                profileNo = galleryImages.length + 1;
                imageSrc = selectedGalleryImage;
            }
        } else if (activeMainTab === 'creator') {
            profileNo = galleryImages.length + 2; // reserved id for creator-generated
            imageSrc = getCreatorImagePath();
        }

        if (onSave && profileNo !== null) {
            onSave({ profileNo, imageSrc });
        }
    };

    const getCurrentImage = () => {
        if (activeMainTab === 'gallery') return selectedGalleryImage;
        if (activeMainTab === 'creator') return getCreatorImagePath();
        return null;
    };

    const currentHairColors = hairColors[character.gender];
    const currentImage = getCurrentImage();

    return (
        <div className="container edit-profile">
            {/* <header className="header">
          <div className="title-wrapper">
            <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
            </svg>
            <h1 className="title">Profil Şəkli Seç</h1>
          </div>
          <p className="subtitle">Qaleriyadan seç, dizayn et və ya yüklə</p>
        </header> */}

            <div className="main-tabs-container">
                <div className="main-tabs">
                    {mainTabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`main-tab ${activeMainTab === tab.id ? 'active' : ''}`}
                                onClick={() => handleTabClick(tab.id)}>
                                {/* <Icon className="main-tab-icon" /> */}
                                <span className="main-tab-text">{tab.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="main-grid">
                {/* Preview Section */}
                <div className="preview-card">
                    <div className="preview-box">
                        <div className="preview-bg"></div>
                        {currentImage ? (
                            <div className="character-wrapper" ref={characterRef}>
                                <img
                                    src={currentImage}
                                    alt="Profile"
                                    className="character-img"
                                    onError={(e) => {
                                        console.error('Image load error');
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="empty-state">
                                {/* <button className="btn btn-primary" onClick={handleSave}>
                                    {t('save')}
                                </button> */}
                                {/* <User className="empty-state-icon" /> */}
                                <p className="empty-state-text">{t('profile_not_selected')}</p>
                            </div>
                        )}
                    </div>

                    {/* <div className="preview-footer">
                        <div className="char-info">
                            <span className="info-label">Status: </span>
                            <span className="info-value">
                                {currentImage ? 'Seçilib' : 'Boş'}
                            </span>
                        </div>
                        <div className="action-btns">
                            {currentImage && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => exportImage(currentImage)}
                                >
                                    {/* <Download size={16} /> *
                                    Yüklə
                                </button>
                            
                        </div>
                    </div> */}

                    {/* <div className="info-box">
                        💡 Profil şəklini seçin və "Yüklə" düyməsi ilə PNG formatında saxlayın
                    </div> */}
                </div>

                {/* Controls Section */}
                <div className="controls-card">
                    {activeMainTab === 'gallery' && (
                        <div className="gallery-grid">
                            {galleryImages.map(img => (
                                <div
                                    key={img.id}
                                    className={`gallery-item ${selectedGalleryImage === img.src ? 'active' : ''}`}
                                    onClick={() => setSelectedGalleryImage(selectedGalleryImage === img.src ? null : img.src)}
                                >
                                    <img src={img.src} alt={img.name} className="gallery-img" />
                                    <div className="gallery-name">{img.name}</div>
                                </div>
                            ))}

                            {/* Upload card appended to gallery */}
                            <div
                                className={`gallery-item upload-card ${selectedGalleryImage && selectedGalleryImage.startsWith('data:') ? 'active' : ''}`}
                                onClick={triggerFileInput}
                            >
                                {uploadedImage ? (
                                    <img src={uploadedImage} alt="Uploaded" className="gallery-img" />
                                ) : (
                                    <div className="upload-placeholder">+</div>
                                )}
                                <div className="gallery-name">{t('upload_label')}</div>
                            </div>

                            {/* Hidden file input used by upload card */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="file-input"
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}

                    {activeMainTab === 'creator' && (
                        <>
                            <div className="control-section">
                                {/* <div className="section-header">
                                    // {/* <User className="section-icon" /> 
                                    <h3 className="section-title">Cinsiyyət</h3>
                                </div> */}
                                <div className="gender-grid">
                                    <button
                                        className={`choice-btn ${character.gender === 'man' ? 'active' : ''}`}
                                        onClick={() => updateGender('man')}
                                    >
                                        ♂️ {t('male')}
                                    </button>
                                    <button
                                        className={`choice-btn ${character.gender === 'woman' ? 'active' : ''}`}
                                        onClick={() => updateGender('woman')}
                                    >
                                        ♀️ {t('female')}
                                    </button>
                                </div>
                            </div>

                            <div className="control-section">
                                {/* <div className="section-header">
                                    <Palette className="section-icon" />
                                    <h3 className="section-title">Saç Rəngi</h3>
                                </div> */}
                                <div className="color-grid">
                                    {currentHairColors.map(color => (
                                        <div
                                            key={color.id}
                                            className="color-item"
                                            onClick={() => updateHairColor(color.id)}
                                        >
                                            <div
                                                className={`color-box ${character.hairColor === color.id ? 'active' : ''}`}
                                                style={{ backgroundColor: color.color }}
                                            ></div>
                                            <div className="color-name">{t(color.name)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* upload tab merged into gallery as an upload card */}
                </div>
            </div>

            <div className="modal-save-bar">
                <button className="btn" onClick={() => onCancel && onCancel()}>{t('cancel')}</button>
                <button className="btn btn-primary" onClick={handleSave}>{t('save')}</button>
            </div>
        </div>

    );
};

export default CharacterCreator;
