import React from 'react';

interface ProductCreateViewProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  uploadingMedia: boolean;
  newCategory: string;
  setNewCategory: (val: string) => void;
  newName: string;
  setNewName: (val: string) => void;
  newDescription: string;
  handleDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  newPrice: string;
  setNewPrice: (val: string) => void;
  newStock: string;
  setNewStock: (val: string) => void;
  newFit: string;
  setNewFit: (val: string) => void;
  newGsm: string;
  setNewGsm: (val: string) => void;
  newSizes: string;
  setNewSizes: (val: string) => void;
  newColors: string;
  setNewColors: (val: string) => void;
  newMaterial: string;
  setNewMaterial: (val: string) => void;
  newCare: string;
  setNewCare: (val: string) => void;
  newSleeve: string;
  setNewSleeve: (val: string) => void;
  newPattern: string;
  setNewPattern: (val: string) => void;
  newOccasion: string;
  setNewOccasion: (val: string) => void;
  newMadeIn: string;
  setNewMadeIn: (val: string) => void;
  newDetails: string;
  setNewDetails: (val: string) => void;
  mediaPreviews: { url: string; type: 'image' | 'video' }[];
  handleMediaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeSelectedMedia: (index: number) => void;
}

export const ProductCreateView: React.FC<ProductCreateViewProps> = ({
  onClose,
  onSubmit,
  submitting,
  uploadingMedia,
  newCategory,
  setNewCategory,
  newName,
  setNewName,
  newDescription,
  handleDescriptionChange,
  newPrice,
  setNewPrice,
  newStock,
  setNewStock,
  newFit,
  setNewFit,
  newGsm,
  setNewGsm,
  newSizes,
  setNewSizes,
  newColors,
  setNewColors,
  newMaterial,
  setNewMaterial,
  newCare,
  setNewCare,
  newSleeve,
  setNewSleeve,
  newPattern,
  setNewPattern,
  newOccasion,
  setNewOccasion,
  newMadeIn,
  setNewMadeIn,
  newDetails,
  setNewDetails,
  mediaPreviews,
  handleMediaChange,
  removeSelectedMedia
}) => {
  return (
    <div className="admin-products-container animate-fade-in" style={{ width: '100%', maxWidth: '100%', minHeight: '100vh', backgroundColor: '#000', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1a1a1a', paddingBottom: '15px' }}>
          <h2 style={{ color: '#fff', fontSize: '16px', letterSpacing: '2px', margin: 0, fontWeight: '600' }}>ADD NEW PRODUCT</h2>
          <button
            type="button"
            onClick={onClose}
            className="smooth-transition"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#aaa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              padding: 0,
              lineHeight: 1,
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#aaa';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✕</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', border: '1px dashed #333', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#050505', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span style={{ fontSize: '9px', color: '#888', marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Upload</span>
              <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} style={{ display: 'none' }} />
            </label>
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category (e.g. APPAREL)"
                className="minimal-input"
              />
            </div>
          </div>

          {mediaPreviews.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {mediaPreviews.map((media, idx) => (
                <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', border: '1px solid #333', borderRadius: '6px', backgroundColor: '#000', overflow: 'visible' }}>
                  {media.type === 'video' ? (
                    <video src={media.url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                  ) : (
                    <img src={media.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => removeSelectedMedia(idx)}
                    className="smooth-transition"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      padding: 0,
                      lineHeight: 1,
                      fontWeight: 'bold'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✕</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Product Name *"
              className="minimal-input"
            />
          </div>

          <div>
            <textarea
              value={newDescription}
              onChange={handleDescriptionChange}
              placeholder="Description (Bio)"
              rows={3}
              className="minimal-input"
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Price (৳) *"
              className="minimal-input"
              style={{ flex: '1 1 200px' }}
            />
            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="Stock Quantity"
              className="minimal-input"
              style={{ flex: '1 1 200px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px 20px' }}>
            <input type="text" value={newFit} onChange={(e) => setNewFit(e.target.value)} placeholder="Fit (e.g. Regular Fit)" className="minimal-input" />
            <input type="text" value={newGsm} onChange={(e) => setNewGsm(e.target.value)} placeholder="GSM (e.g. 180)" className="minimal-input" />
            <input type="text" value={newSizes} onChange={(e) => setNewSizes(e.target.value)} placeholder="Sizes (e.g. S, M, L, XL)" className="minimal-input" />
            <input type="text" value={newColors} onChange={(e) => setNewColors(e.target.value)} placeholder="Colors (e.g. BLACK, WHITE)" className="minimal-input" />
            <input type="text" value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} placeholder="Material (e.g. 100% Cotton)" className="minimal-input" />
            <input type="text" value={newCare} onChange={(e) => setNewCare(e.target.value)} placeholder="Care (e.g. Machine Wash)" className="minimal-input" />
            <input type="text" value={newSleeve} onChange={(e) => setNewSleeve(e.target.value)} placeholder="Sleeve (e.g. Half Sleeve)" className="minimal-input" />
            <input type="text" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} placeholder="Pattern (e.g. Solid)" className="minimal-input" />
            <input type="text" value={newOccasion} onChange={(e) => setNewOccasion(e.target.value)} placeholder="Occasion (e.g. Casual)" className="minimal-input" />
            <input type="text" value={newMadeIn} onChange={(e) => setNewMadeIn(e.target.value)} placeholder="Made In (e.g. Bangladesh)" className="minimal-input" />
          </div>

          <div>
            <textarea
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="Details (Product Details)"
              rows={4}
              className="minimal-input"
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            <button
              type="button"
              onClick={onClose}
              className="smooth-transition"
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#aaa',
                padding: '12px',
                fontSize: '11px',
                letterSpacing: '1px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingMedia}
              className="smooth-transition"
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#fff',
                padding: '12px',
                fontSize: '11px',
                letterSpacing: '1px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {uploadingMedia ? 'UPLOADING MEDIA...' : submitting ? 'SAVING...' : 'CREATE PRODUCT'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .minimal-input {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid #262626 !important;
          color: #fff !important;
          font-size: 11px !important;
          outline: none !important;
          padding: 8px 0 !important;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
          font-family: inherit;
        }
        .minimal-input:focus {
          border-bottom-color: #555 !important;
        }
        .minimal-input::placeholder {
          color: #555;
        }
      `}</style>
    </div>
  );
};
