import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AdminProductsProps } from './products.types';
import { ProductShowroomCard } from './ProductShowroomCard';
import { ProductCreateView } from './ProductCreateView';
import { ProductEditView } from './ProductEditView';
import { ProductDeleteModal } from './ProductDeleteModal';
import { ProductFilterPanel } from './ProductFilterPanel';
import { useAdminProducts } from '@/hooks/useAdminProducts';

const AdminProducts: React.FC<AdminProductsProps> = ({
  showAddModal: externalShowAddModal,
  setShowAddModal: externalSetShowAddModal,
  searchQuery = '',
  isFilterOpen = false,
  isAddOpen,
  onCloseAdd
}) => {
  const {
    filteredProducts, filteredCategories, loading, showAddPage, setShowAddPage,
    submitting, expandedCategories, setExpandedCategories, editingProduct, setEditingProduct,
    setRemovedMediaUrls, editName, setEditName, editPrice, setEditPrice,
    editStock, setEditStock, editCategory, setEditCategory, editDescription, setEditDescription,
    editFit, setEditFit, editGsm, setEditGsm, editMadeIn, setEditMadeIn, editMaterial, setEditMaterial,
    editCare, setEditCare, editSleeve, setEditSleeve, editPattern, setEditPattern, editOccasion,
    setEditOccasion, editSizes, setEditSizes, editColors, setEditColors, editDetails, setEditDetails,
    editExistingMedia, editMediaFiles, editMediaPreviews, handleEditMediaChange, removeExistingMedia,
    removeSelectedEditMedia, handleEditDescriptionChange, handleUpdateProduct, handleStockUpdate,
    handleUnhideProduct, handleOpenEdit, handleAddProduct, handleMediaChange, removeSelectedMedia,
    handleDescriptionChange, newName, setNewName, newPrice, setNewPrice, newStock, setNewStock,
    newCategory, setNewCategory, newDescription, setNewDescription, newFit, setNewFit, newGsm,
    setNewGsm, newMadeIn, setNewMadeIn, newMaterial, setNewMaterial, newCare, setNewCare,
    newSleeve, setNewSleeve, newPattern, setNewPattern, newOccasion, setNewOccasion, newSizes,
    setNewSizes, newColors, setNewColors, newDetails, setNewDetails, mediaPreviews, uploadingMedia,
    stockFilter, setStockFilter, dateSort, setDateSort, priceSort, setPriceSort, startDate, setStartDate,
    endDate, setEndDate, minPrice, setMinPrice, maxPrice, setMaxPrice, notification, deleteConfirmConfig,
    setDeleteConfirmConfig, isConfirmedChecked, setIsConfirmedChecked, handleConfirmDeleteAction
  } = useAdminProducts(searchQuery, onCloseAdd, externalShowAddModal, externalSetShowAddModal);

  useEffect(() => {
    if (isAddOpen !== undefined) {
      setShowAddPage(isAddOpen);
    } else if (externalShowAddModal !== undefined) {
      setShowAddPage(externalShowAddModal);
    }
  }, [isAddOpen, externalShowAddModal]);

  const handleSetShowAddModal = (value: boolean) => {
    setShowAddPage(value);
    if (externalSetShowAddModal) {
      externalSetShowAddModal(value);
    }
    if (!value && onCloseAdd) {
      onCloseAdd();
    }
  };

  if (showAddPage) {
    return (
      <>
        {notification && createPortal(
          <div className="animate-pop" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10001, backgroundColor: '#0d0d0d', border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`, boxShadow: notification.type === 'error' ? '0 10px 30px rgba(239, 68, 68, 0.15)' : '0 10px 30px rgba(34, 197, 94, 0.15)', color: '#ffffff', padding: '12px 18px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: notification.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '11px', fontWeight: 'bold', padding: 0, lineHeight: 1 }}>{notification.type === 'error' ? '✕' : '✓'}</span>
            <span>{notification.message}</span>
          </div>,
          document.body
        )}
        <ProductCreateView
          onClose={() => handleSetShowAddModal(false)}
          onSubmit={(e) => handleAddProduct(e, setShowAddPage)}
          submitting={submitting}
          uploadingMedia={uploadingMedia}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          newName={newName}
          setNewName={setNewName}
          newDescription={newDescription}
          handleDescriptionChange={handleDescriptionChange}
          newPrice={newPrice}
          setNewPrice={setNewPrice}
          newStock={newStock}
          setNewStock={setNewStock}
          newFit={newFit}
          setNewFit={setNewFit}
          newGsm={newGsm}
          setNewGsm={setNewGsm}
          newSizes={newSizes}
          setNewSizes={setNewSizes}
          newColors={newColors}
          setNewColors={setNewColors}
          newMaterial={newMaterial}
          setNewMaterial={setNewMaterial}
          newCare={newCare}
          setNewCare={setNewCare}
          newSleeve={newSleeve}
          setNewSleeve={setNewSleeve}
          newPattern={newPattern}
          setNewPattern={setNewPattern}
          newOccasion={newOccasion}
          setNewOccasion={setNewOccasion}
          newMadeIn={newMadeIn}
          setNewMadeIn={setNewMadeIn}
          newDetails={newDetails}
          setNewDetails={setNewDetails}
          mediaPreviews={mediaPreviews}
          handleMediaChange={handleMediaChange}
          removeSelectedMedia={removeSelectedMedia}
        />
      </>
    );
  }

  if (editingProduct) {
    return (
      <>
        {notification && createPortal(
          <div className="animate-pop" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10001, backgroundColor: '#0d0d0d', border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`, boxShadow: notification.type === 'error' ? '0 10px 30px rgba(239, 68, 68, 0.15)' : '0 10px 30px rgba(34, 197, 94, 0.15)', color: '#ffffff', padding: '12px 18px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: notification.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '11px', fontWeight: 'bold', padding: 0, lineHeight: 1 }}>{notification.type === 'error' ? '✕' : '✓'}</span>
            <span>{notification.message}</span>
          </div>,
          document.body
        )}
        <ProductEditView
          editingProduct={editingProduct}
          onClose={() => {
            setEditingProduct(null);
            setRemovedMediaUrls([]);
          }}
          onSubmit={handleUpdateProduct}
          onOpenDeleteConfirm={(type, productId) => {
            setDeleteConfirmConfig({ type, productId });
            setIsConfirmedChecked(false);
          }}
          submitting={submitting}
          uploadingMedia={uploadingMedia}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
          editName={editName}
          setEditName={setEditName}
          editDescription={editDescription}
          handleEditDescriptionChange={handleEditDescriptionChange}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          editStock={editStock}
          setEditStock={setEditStock}
          editFit={editFit}
          setEditFit={setEditFit}
          editGsm={editGsm}
          setEditGsm={setEditGsm}
          editSizes={editSizes}
          setEditSizes={setEditSizes}
          editColors={editColors}
          setEditColors={setEditColors}
          editMaterial={editMaterial}
          setEditMaterial={setEditMaterial}
          editCare={editCare}
          setEditCare={setEditCare}
          editSleeve={editSleeve}
          setEditSleeve={setEditSleeve}
          editPattern={editPattern}
          setEditPattern={setEditPattern}
          editOccasion={editOccasion}
          setEditOccasion={setEditOccasion}
          editMadeIn={editMadeIn}
          setEditMadeIn={setEditMadeIn}
          editDetails={editDetails}
          setEditDetails={setEditDetails}
          editExistingMedia={editExistingMedia}
          editMediaPreviews={editMediaPreviews}
          handleEditMediaChange={handleEditMediaChange}
          removeExistingMedia={removeExistingMedia}
          removeSelectedEditMedia={removeSelectedEditMedia}
        />
        <ProductDeleteModal
          config={deleteConfirmConfig}
          isChecked={isConfirmedChecked}
          onCheckChange={setIsConfirmedChecked}
          onCancel={() => {
            setDeleteConfirmConfig(null);
            setIsConfirmedChecked(false);
          }}
          onConfirm={handleConfirmDeleteAction}
        />
      </>
    );
  }

  return (
    <div className="admin-products-container animate-fade-in" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#000', minHeight: '100vh', padding: '0 20px 20px 20px', boxSizing: 'border-box' }}>
      {notification && createPortal(
        <div
          className="animate-pop"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10001,
            backgroundColor: '#0d0d0d',
            border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
            boxShadow: notification.type === 'error'
              ? '0 10px 30px rgba(239, 68, 68, 0.15)'
              : '0 10px 30px rgba(34, 197, 94, 0.15)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            color: notification.type === 'error' ? '#ef4444' : '#22c55e',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: 0,
            lineHeight: 1
          }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{notification.type === 'error' ? '✕' : '✓'}</span>
          </span>
          <span>{notification.message}</span>
        </div>,
        document.body
      )}

      {isFilterOpen && (
        <div className="filter-expand-wrapper open">
          <div className="filter-expand-content">
            <ProductFilterPanel
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              dateSort={dateSort}
              setDateSort={setDateSort}
              priceSort={priceSort}
              setPriceSort={setPriceSort}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '11px' }}>LOADING PRODUCTS...</div>
      ) : (
        <div style={{ marginTop: '10px' }}>
          {filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#555', fontSize: '11px', fontFamily: 'monospace' }}>NO PRODUCTS FOUND</div>
          ) : (
            filteredCategories.map((category) => {
              const categoryProducts = filteredProducts.filter(p => p.category === category);
              const isExpanded = !!expandedCategories[category];

              return (
                <div key={category} className="showroom-section animate-fade-in" style={{ marginBottom: '50px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px 12px 15px', borderBottom: '1px solid #141414' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase' }}>{category}</h3>
                    <button
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
                      className="smooth-transition"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        opacity: 0.7,
                        display: 'flex',
                        padding: 0,
                        alignItems: 'center',
                        minWidth: '85px',
                        justifyContent: 'flex-end',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>SEE&nbsp;</span>
                      <span style={{ display: 'inline-block', width: '35px', textAlign: 'left' }}>
                        {isExpanded ? 'LESS' : 'MORE'}
                      </span>
                    </button>
                  </div>

                  <div className="showroom-row-container" style={{ display: 'flex', flexWrap: isExpanded ? 'wrap' : 'nowrap', width: '100%', scrollSnapType: 'x mandatory', overflowX: 'auto', scrollBehavior: 'smooth' }}>
                    {categoryProducts.map((product) => (
                      <ProductShowroomCard
                        key={product.id}
                        product={product}
                        onUpdateStock={handleStockUpdate}
                        onEdit={handleOpenEdit}
                        onUnhide={handleUnhideProduct}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <style>{`
        @keyframes swapFadeIn {
          from { opacity: 0; transform: translateY(1px); }
          to { opacity: 1; transform: translateY(0); }
        }
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
        .filter-expand-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .filter-expand-wrapper.open {
          grid-template-rows: 1fr;
        }
        .filter-expand-content {
          min-height: 0;
          transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
          opacity: 0;
          transform: translateY(-8px);
          overflow: hidden;
        }
        .filter-expand-wrapper.open .filter-expand-content {
          opacity: 1;
          transform: translateY(0);
        }
        .showroom-row-container::-webkit-scrollbar {
          display: none;
        }
        .showroom-row-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 767px) {
          .admin-products-container {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .showroom-section {
            width: 100%;
          }
          .showroom-card-item {
            width: 100% !important;
            min-width: 100% !important;
            padding: 0 0 15px 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-radius: 0 !important;
          }
        }
        @media (min-width: 768px) {
          .showroom-section {
            padding: 0;
          }
          .showroom-card-item {
            width: 300px;
            min-width: 300px;
            padding: 12px;
            margin-right: 15px;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminProducts;
