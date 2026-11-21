import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalLoading } from '@/context/LoadingContext';

export const GlobalSkeleton: React.FC = () => {
  const { pathname } = useLocation();
  const { skeletonView, isAmbassadorSkeleton } =
    useGlobalLoading();

  const isProfilePath = pathname.startsWith('/profile');

  const isAmbassadorMode =
    isAmbassadorSkeleton || skeletonView === 'ambassador';

  const shimmerStyle: React.CSSProperties = {
    backgroundColor: '#1C1C1F',
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.4s ease-in-out infinite',
    borderRadius: '8px',
  };

  const renderProfileHeaderSkeleton = (
    withBadge = false
  ) => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 998,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        borderBottom: '1px solid #1F1F22',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            ...shimmerStyle,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              ...shimmerStyle,
              height: '13px',
              width: '46%',
              maxWidth: '150px',
              borderRadius: '4px',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {withBadge && (
              <div
                style={{
                  ...shimmerStyle,
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              />
            )}

            <div
              style={{
                ...shimmerStyle,
                height: '9px',
                width: withBadge ? '28%' : '36%',
                maxWidth: '120px',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        {[1, 2].map((item) => (
          <div
            key={item}
            style={{
              ...shimmerStyle,
              width: '35px',
              height: '35px',
              borderRadius: '50%',
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderSubViewTopBarSkeleton = (
    withRightPill = false
  ) => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 998,
        backgroundColor: '#000000',
        borderBottom: '1px solid #1A1A1A',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div
          style={{
            ...shimmerStyle,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
          }}
        />

        <div
          style={{
            ...shimmerStyle,
            width: '112px',
            height: '16px',
            borderRadius: '4px',
          }}
        />
      </div>

      {withRightPill && (
        <div
          style={{
            ...shimmerStyle,
            width: '74px',
            height: '30px',
            borderRadius: '16px',
          }}
        />
      )}
    </div>
  );

  const isUpdatePassword =
    skeletonView === 'password' ||
    (!skeletonView && pathname === '/update-password');

  const isSettings =
    !isUpdatePassword &&
    (skeletonView === 'settings' ||
      (!skeletonView &&
        !isProfilePath &&
        pathname.startsWith('/settings')));

  const isCommunication =
    !isUpdatePassword &&
    !isSettings &&
    (skeletonView === 'communication' ||
      skeletonView === 'chat' ||
      (!skeletonView &&
        !isProfilePath &&
        (pathname.startsWith('/vip/') ||
          pathname.startsWith('/messages'))));

  const isNotifications =
    !isUpdatePassword &&
    !isSettings &&
    !isCommunication &&
    (skeletonView === 'notifications' ||
      (!skeletonView &&
        !isProfilePath &&
        pathname.startsWith('/notifications')));

  const isAmbassadorView =
    !isUpdatePassword &&
    !isSettings &&
    !isCommunication &&
    !isNotifications &&
    skeletonView === 'ambassador';

  const isOrdersView =
    !isUpdatePassword &&
    !isSettings &&
    !isCommunication &&
    !isNotifications &&
    !isAmbassadorView &&
    skeletonView === 'orders';

  const isHome =
    !isUpdatePassword &&
    !isSettings &&
    !isCommunication &&
    !isNotifications &&
    !isAmbassadorView &&
    !isOrdersView &&
    (skeletonView === 'home' ||
      (!skeletonView &&
        !isProfilePath &&
        pathname === '/'));

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes skeletonShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 767px) {
          .home-skeleton-card {
            width: 100vw !important;
            min-width: 100vw !important;
            padding: 0 15px !important;
          }
        }

        @media (min-width: 768px) {
          .home-skeleton-card {
            width: 300px;
            min-width: 300px;
            padding: 0 10px;
          }
        }
      `}</style>

      {isHome && (
        <div
          style={{
            width: '100%',
            backgroundColor: '#000',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              ...shimmerStyle,
              height: '100vh',
              width: '100%',
              borderRadius: 0,
            }}
          />

          <main
            style={{
              padding: '32px 15px',
              boxSizing: 'border-box',
            }}
          >
            {[1, 2].map((section) => (
              <section
                key={section}
                style={{
                  marginBottom: '25px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 15px 12px',
                    borderBottom: '1px solid #141414',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      ...shimmerStyle,
                      width: '130px',
                      height: '14px',
                      borderRadius: '4px',
                    }}
                  />

                  <div
                    style={{
                      ...shimmerStyle,
                      width: '72px',
                      height: '14px',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    overflow: 'hidden',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {[1, 2, 3].map((card) => (
                    <div
                      key={card}
                      className="home-skeleton-card"
                      style={{
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          ...shimmerStyle,
                          width: '100%',
                          height: '270px',
                          borderRadius: 0,
                        }}
                      />

                      <div
                        style={{
                          marginTop: '15px',
                          padding: '0 5px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            ...shimmerStyle,
                            width: '70%',
                            height: '15px',
                            borderRadius: '4px',
                          }}
                        />

                        <div
                          style={{
                            ...shimmerStyle,
                            width: '92%',
                            height: '12px',
                            borderRadius: '4px',
                          }}
                        />

                        <div
                          style={{
                            ...shimmerStyle,
                            width: '82%',
                            height: '12px',
                            borderRadius: '4px',
                          }}
                        />

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            height: '42px',
                            marginTop: '15px',
                          }}
                        >
                          <div
                            style={{
                              ...shimmerStyle,
                              width: '50px',
                              height: '15px',
                              borderRadius: '4px',
                            }}
                          />

                          <div
                            style={{
                              ...shimmerStyle,
                              width: '130px',
                              height: '36px',
                              borderRadius: 0,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      )}

      {isSettings && (
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            paddingTop: '52px',
            padding: '52px 16px 20px',
          }}
        >
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 998,
              backgroundColor: '#000000',
              borderBottom: '1px solid #1A1A1A',
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                ...shimmerStyle,
                width: '96px',
                height: '15px',
                borderRadius: '4px',
              }}
            />

            <div
              style={{
                ...shimmerStyle,
                width: '20px',
                height: '20px',
                borderRadius: '4px',
              }}
            />
          </div>

          {isAmbassadorMode && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '26px',
              }}
            >
              <div
                style={{
                  ...shimmerStyle,
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                }}
              />
            </div>
          )}

          {[1, 2, 3].map((item) => (
            <div key={item}>
              <div
                style={{
                  ...shimmerStyle,
                  width: item === 1 ? '54px' : '104px',
                  height: '9px',
                  borderRadius: '3px',
                  marginBottom: '10px',
                }}
              />

              <div
                style={{
                  ...shimmerStyle,
                  width: item === 1 ? '62%' : '74%',
                  height: '15px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                }}
              />

              <div
                style={{
                  height: '1px',
                  backgroundColor: '#1E1E1E',
                  marginBottom: '22px',
                }}
              />
            </div>
          ))}

          {isAmbassadorMode && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  style={{
                    ...shimmerStyle,
                    width: `${120 + item * 18}px`,
                    height: '14px',
                    borderRadius: '4px',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isCommunication && (
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            paddingTop: '58px',
            paddingBottom: '76px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          {renderSubViewTopBarSkeleton(false)}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: '12px',
              padding: '0 16px',
            }}
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  ...shimmerStyle,
                  width: item === 2 ? '62%' : '68%',
                  height: item === 1 ? '46px' : '38px',
                  borderRadius: '14px',
                  alignSelf:
                    item === 2
                      ? 'flex-end'
                      : 'flex-start',
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#000000',
              borderTop: '1px solid #18181B',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                ...shimmerStyle,
                flex: 1,
                height: '42px',
                borderRadius: '22px',
              }}
            />

            <div
              style={{
                ...shimmerStyle,
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      )}

      {isNotifications && (
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            paddingTop: '62px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          {renderSubViewTopBarSkeleton(true)}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '10px',
            }}
          >
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                style={{
                  backgroundColor: '#0A0A0B',
                  border: '1px solid #18181B',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    ...shimmerStyle,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                  }}
                >
                  <div
                    style={{
                      ...shimmerStyle,
                      width: '54%',
                      height: '13px',
                      borderRadius: '4px',
                    }}
                  />

                  <div
                    style={{
                      ...shimmerStyle,
                      width: '88%',
                      height: '11px',
                      borderRadius: '4px',
                    }}
                  />

                  <div
                    style={{
                      ...shimmerStyle,
                      width: '64%',
                      height: '11px',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAmbassadorView && (
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            paddingTop: '54px',
          }}
        >
          {renderProfileHeaderSkeleton(true)}

          {[1, 2].map((item) => (
            <div
              key={item}
              style={{
                margin: '18px 16px',
                backgroundColor: '#0A0A0B',
                border: '1px solid #1A1A1D',
                borderRadius: '14px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  ...shimmerStyle,
                  width: '62%',
                  height: '12px',
                  borderRadius: '4px',
                  marginBottom: '14px',
                }}
              />

              <div
                style={{
                  ...shimmerStyle,
                  width: '88%',
                  height: '10px',
                  borderRadius: '4px',
                  marginBottom: '10px',
                }}
              />

              <div
                style={{
                  ...shimmerStyle,
                  width: '48%',
                  height: '10px',
                  borderRadius: '4px',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {isOrdersView && (
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            paddingTop: '54px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          {renderProfileHeaderSkeleton(false)}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #17171A',
              paddingBottom: '12px',
              marginTop: '18px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                ...shimmerStyle,
                width: '122px',
                height: '11px',
                borderRadius: '4px',
              }}
            />

            <div
              style={{
                ...shimmerStyle,
                width: '60px',
                height: '11px',
                borderRadius: '4px',
              }}
            />
          </div>

          {[1, 2].map((orderCard) => (
            <div
              key={orderCard}
              style={{
                backgroundColor: '#070708',
                border: '1px solid #1D1D20',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '18px',
              }}
            >
              {[1, 2, 3].map((line) => (
                <div
                  key={line}
                  style={{
                    ...shimmerStyle,
                    width:
                      line === 1
                        ? '126px'
                        : line === 2
                          ? '68%'
                          : '48%',
                    height:
                      line === 1
                        ? '10px'
                        : '12px',
                    borderRadius: '4px',
                    marginBottom: '14px',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {isUpdatePassword && (
        <div
          style={{
            maxWidth: '400px',
            margin: '100px auto',
          }}
        >
          <div
            style={{
              ...shimmerStyle,
              height: '300px',
              width: '100%',
            }}
          />
        </div>
      )}
    </div>
  );
};