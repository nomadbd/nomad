import React from 'react';
import { Product } from './products.types';

interface ProductEditViewProps {
  editingProduct: Product;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenDeleteConfirm: (type: 'soft' | 'hard', id: string | number) => void;
  submitting: boolean;
  uploadingMedia: boolean;
  editCategory: string;
  setEditCategory: (val: string) => void;
  editName: string;
  setEditName: (val: string) => void;
  editDescription: string;
  handleEditDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  editPrice: string;
  setEditPrice: (val: string) => void;
  editStock: string;
  setEditStock: (val: string) => void;
  editFit: string;
  setEditFit: (val: string) => void;
  editGsm: string;
  setEditGsm: (val: string) => void;
  editSizes: string;
  setEditSizes: (val: string) => void;
  editColors: string;
  setEditColors: (val: string) => void;
  editMaterial: string;
  setEditMaterial: (val: string) => void;
  editCare: string;
  setEditCare: (val: string) => void;
  editSleeve: string;
  setEditSleeve: (val: string) => void;
  editPattern: string;
  setEditPattern: (val: string) => void;
  editOccasion: string;
  setEditOccasion: (val: string) => void;
  editMadeIn: string;
  setEditMadeIn: (val: string) => void;
  editDetails: string;
  setEditDetails: (val: string) => void;
  editExistingMedia: { id?: string | number; media_url: string; media_type: string }[];
  editMediaPreviews: { url: string; type: 'image' | 'video' }[];
  handleEditMediaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeExistingMedia: (index: number) => void;
  removeSelectedEditMedia: (index: number) => void;
}

export const ProductEditView: React.FC<ProductEditViewProps> = ({
  editingProduct,
  onClose,
  onSubmit,
  onOpenDeleteConfirm,
  submitting,
  uploadingMedia,
  editCategory,
  setEditCategory,
  editName,
  setEditName,
  editDescription,
  handleEditDescriptionChange,
  editPrice,
  setEditPrice,
  editStock,
  setEditStock,
  editFit,
  setEditFit,
  editGsm,
  setEditGsm,
  editSizes,
  setEditSizes,
  editColors,
  setEditColors,
  editMaterial,
  setEditMaterial,
  editCare,
  setEditCare,
  editSleeve,
  setEditSleeve,
  editPattern,
  setEditPattern,
  editOccasion,
  setEditOccasion,
  editMadeIn,
  setEditMadeIn,
  editDetails,
  setEditDetails,
  editExistingMedia,
  editMediaPreviews,
  handleEditMediaChange,
  removeExistingMedia,
  removeSelectedEditMedia
}) => {
  return (
    <div className="admin-products-container animate-fade-in" style={{ width: '100%', maxWidth: '100%', minHeight: '100vh', backgroundColor: '#000', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1a1a1a', paddingBottom: '15px' }}>
          <h2 style={{ color: '#fff', fontSize: '16px', letterSpacing: '2px', margin: 0, fontWeight: '600' }}>EDIT PRODUCT</h2>
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

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', border: '1px dashed #333', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#050505', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span style={{ fontSize: '9px', color: '#888', marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Upload</span>
              <input type="file" multiple accept="image/*,video/*" onChange={handleEditMediaChange} style={{ display: 'none' }} />
            </label>
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="Category (e.g. APPAREL)"
                className="minimal-input"
              />
            </div>
          </div>

          {(editExistingMedia.length > 0 || editMediaPreviews.length > 0) && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {editExistingMedia.map((media, idx) => (
                <div key={`existing-${idx}`} style={{ position: 'relative', width: '60px', height: '60px', border: '1px solid #333', borderRadius: '6px', backgroundColor: '#000', overflow: 'visible' }}>
                  {media.media_type === 'video' ? (
                    <video src={media.media_url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                  ) : (
                    <img src={media.media_url} alt="existing" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingMedia(idx)}
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

              {editMediaPreviews.map((media, idx) => (
                <div key={`new-${idx}`} style={{ position: 'relative', width: '60px', height: '60px', border: '1px solid #333', borderRadius: '6px', backgroundColor: '#000', overflow: 'visible' }}>
                  {media.type === 'video' ? (
                    <video src={media.url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                  ) : (
                    <img src={media.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => removeSelectedEditMedia(idx)}
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
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Product Name *"
              className="minimal-input"
            />
          </div>

          <div>
            <textarea
              value={editDescription}
              onChange={handleEditDescriptionChange}
              placeholder="Description (Bio)"
              rows={3}
              className="minimal-input"
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="Price (৳) *"
              className="minimal-input"
              style={{ flex: '1 1 200px' }}
            />
            <input
              type="number"
              value={editStock}
              onChange={(e) => setEditStock(e.target.value)}
              placeholder="Stock Quantity"
              className="minimal-input"
              style={{ flex: '1 1 200px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px 20px' }}>
            <input type="text" value={editFit} onChange={(e) => setEditFit(e.target.value)} placeholder="Fit (e.g. Regular Fit)" className="minimal-input" />
            <input type="text" value={editGsm} onChange={(e) => setEditGsm(e.target.value)} placeholder="GSM (e.g. 180)" className="minimal-input" />
            <input type="text" value={editSizes} onChange={(e) => setEditSizes(e.target.value)} placeholder="Sizes (e.g. S, M, L, XL)" className="minimal-input" />
            <input type="text" value={editColors} onChange={(e) => setEditColors(e.target.value)} placeholder="Colors (e.g. BLACK, WHITE)" className="minimal-input" />
            <input type="text" value={editMaterial} onChange={(e) => setEditMaterial(e.target.value)} placeholder="Material (e.g. 100% Cotton)" className="minimal-input" />
            <input type="text" value={editCare} onChange={(e) => setEditCare(e.target.value)} placeholder="Care (e.g. Machine Wash)" className="minimal-input" />
            <input type="text" value={editSleeve} onChange={(e) => setEditSleeve(e.target.value)} placeholder="Sleeve (e.g. Half Sleeve)" className="minimal-input" />
            <input type="text" value={editPattern} onChange={(e) => setEditPattern(e.target.value)} placeholder="Pattern (e.g. Solid)" className="minimal-input" />
            <input type="text" value={editOccasion} onChange={(e) => setEditOccasion(e.target.value)} placeholder="Occasion (e.g. Casual)" className="minimal-input" />
            <input type="text" value={editMadeIn} onChange={(e) => setEditMadeIn(e.target.value)} placeholder="Made In (e.g. Bangladesh)" className="minimal-input" />
          </div>

          <div>
            <textarea
              value={editDetails}
              onChange={(e) => setEditDetails(e.target.value)}
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
              {uploadingMedia ? 'UPLOADING MEDIA...' : submitting ? 'SAVING...' : 'UPDATE PRODUCT'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '16px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', letterSpacing: '1px' }}>PRODUCT ACTIONS</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              {editingProduct.status !== 'archived' && editingProduct.status !== 'hidden' && (
                <button
                  type="button"
                  onClick={() => onOpenDeleteConfirm('soft', editingProduct.id)}
                  className="smooth-transition"
                  style={{
                    flex: 1,
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    borderRadius: '6px',
                    color: '#eab308',
                    padding: '10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    letterSpacing: '0.5px'
                  }}
                >
                  HIDE FROM CATALOG
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenDeleteConfirm('hard', editingProduct.id)}
                className="smooth-transition"
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  padding: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  letterSpacing: '0.5px'
                }}
              >
                DELETE PERMANENTLY
              </button>
            </div>
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
