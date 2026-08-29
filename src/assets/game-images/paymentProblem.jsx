import { useEffect } from 'react';

const paymentProblemCss = `
  .payment-problem__overlay {
    position: fixed;
    inset: 0;
    z-index: 999999;
    overflow: auto;
    color: #111111;
    font-family: Tahoma, Verdana, sans-serif;
  }

  .payment-problem__frame {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 18px;
    box-sizing: border-box;
  }

  .payment-problem__window {
    width: min(1080px, 100%);
    background: #c0c0c0;
    border-top: 3px solid #f7f7f7;
    border-left: 3px solid #f7f7f7;
    border-right: 3px solid #202020;
    border-bottom: 3px solid #202020;
    box-shadow: 0 22px 46px rgba(0, 0, 0, 0.45);
  }

  .payment-problem__titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 8px 7px;
    background: linear-gradient(90deg, #0a2e77 0%, #1d59b8 55%, #4b8bf2 100%);
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .payment-problem__titletext {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .payment-problem__controls {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .payment-problem__control {
    width: 18px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #c0c0c0;
    color: #111111;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #2f2f2f;
    border-bottom: 2px solid #2f2f2f;
    font-size: 11px;
    line-height: 1;
    font-weight: 700;
  }

  .payment-problem__menubar,
  .payment-problem__toolbar,
  .payment-problem__addressbar,
  .payment-problem__statusbar {
    background: #d4d0c8;
    border-top: 1px solid #f7f7f7;
    border-left: 1px solid #f7f7f7;
    border-right: 1px solid #8b8b8b;
    border-bottom: 1px solid #8b8b8b;
  }

  .payment-problem__menubar {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    padding: 7px 10px 6px;
    font-size: 13px;
  }

  .payment-problem__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 10px;
  }

  .payment-problem__tool {
    min-width: 66px;
    padding: 5px 9px;
    background: #d4d0c8;
    border-top: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-right: 1px solid #6d6d6d;
    border-bottom: 1px solid #6d6d6d;
    font-size: 12px;
    text-align: center;
  }

  .payment-problem__addressbar {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 8px 10px;
    font-size: 12px;
  }

  .payment-problem__addresslabel {
    font-weight: 700;
  }

  .payment-problem__addressfield {
    min-height: 24px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    background: #ffffff;
    border-top: 2px solid #707070;
    border-left: 2px solid #707070;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .payment-problem__go {
    min-width: 44px;
    padding: 4px 10px;
    background: #d4d0c8;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #5d5d5d;
    border-bottom: 2px solid #5d5d5d;
    font: inherit;
    cursor: default;
  }

  .payment-problem__page {
    padding: 18px;
    background: #efefef;
  }

  .payment-problem__document {
    position: relative;
    background: #ffffff;
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #f7f7f7;
    border-bottom: 2px solid #f7f7f7;
    padding: 28px 30px 24px;
  }

  .payment-problem__headline {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 18px;
    align-items: start;
  }

  .payment-problem__icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #ffef8f 0%, #dcbf28 58%, #8f7303 100%);
    border: 2px solid #111111;
    color: #221a00;
    font-size: 36px;
    font-weight: 700;
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.5);
  }

  .payment-problem__headline h1 {
    margin: 0 0 10px;
    color: #003399;
    font-size: clamp(28px, 4vw, 38px);
    line-height: 1.08;
    font-weight: 700;
  }

  .payment-problem__headline p {
    margin: 0;
    font-size: 16px;
    line-height: 1.55;
  }

  .payment-problem__stamp {
    position: absolute;
    top: 34px;
    right: 24px;
    padding: 8px 12px;
    border: 3px solid #8f1111;
    color: #8f1111;
    background: rgba(255, 234, 234, 0.92);
    font-family: "Courier New", Courier, monospace;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.18em;
    transform: rotate(-7deg);
    box-shadow: 4px 4px 0 rgba(143, 17, 17, 0.2);
    animation: payment-problem__blink 1.7s steps(1, end) infinite;
  }

  .payment-problem__rule {
    margin: 22px 0 18px;
    border-top: 1px solid #b3b3b3;
  }

  .payment-problem__columns {
  
  }

  .payment-problem__panel {
    padding: 14px 16px;
    background: #f5f5f5;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #8a8a8a;
    border-bottom: 2px solid #8a8a8a;
  }

  .payment-problem__panel h2 {
    margin: 0 0 12px;
    font-size: 18px;
    color: #000000;
  }

  .payment-problem__panel p {
    margin: 0 0 12px;
    line-height: 1.6;
    font-size: 15px;
  }

  .payment-problem__list {
    margin: 0;
    padding-left: 22px;
    line-height: 1.7;
    font-size: 15px;
  }

  .payment-problem__list li + li {
    margin-top: 6px;
  }

  .payment-problem__console {
    margin-top: 16px;
    padding: 14px 16px;
    background: #f4f8ff;
    border: 1px dashed #214d95;
    font-family: "Courier New", Courier, monospace;
    font-size: 14px;
    line-height: 1.7;
  }

  .payment-problem__console strong {
    color: #0a2e77;
  }

  .payment-problem__note {
    margin-top: 16px;
    padding: 12px 14px;
    background: #fff4d0;
    border: 1px solid #c5a651;
    font-size: 14px;
    line-height: 1.65;
  }

  .payment-problem__statusbar {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 7px 10px;
    font-size: 12px;
  }

  .payment-problem__statuscell {
    flex: 1;
    padding: 3px 6px;
    background: #d4d0c8;
    border-top: 1px solid #808080;
    border-left: 1px solid #808080;
    border-right: 1px solid #ffffff;
    border-bottom: 1px solid #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @keyframes payment-problem__blink {
    0%, 55%, 100% {
      opacity: 1;
    }

    56%, 85% {
      opacity: 0.32;
    }
  }

  @media (max-width: 860px) {
    .payment-problem__document {
      padding: 22px 18px 18px;
    }

    .payment-problem__stamp {
      position: static;
      display: inline-block;
      margin: 0 0 18px;
      transform: rotate(-4deg);
    }

    .payment-problem__columns {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .payment-problem__frame {
      padding: 12px;
    }

    .payment-problem__headline {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .payment-problem__icon {
      width: 54px;
      height: 54px;
      font-size: 32px;
    }

    .payment-problem__menubar {
      gap: 12px;
      font-size: 12px;
    }

    .payment-problem__toolbar {
      gap: 6px;
    }

    .payment-problem__tool {
      min-width: 54px;
      padding: 4px 7px;
      font-size: 11px;
    }

    .payment-problem__addressbar {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .payment-problem__statusbar {
      flex-direction: column;
    }
  }
`;

function PaymentProblem() {
  const hostName = 'xgame.game';

  const checkedAt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyBackground = document.body.style.background;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.background = '#6b7a81';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.background = previousBodyBackground;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <>
      <style>{paymentProblemCss}</style>

      <section className="payment-problem__overlay" aria-label="Hosting account suspended">
        <div className="payment-problem__frame">
          <div className="payment-problem__window">
            {/* <div className="payment-problem__titlebar">
              <span className="payment-problem__titletext">
                Microsoft Internet Explorer - http://{hostName}/
              </span>

              <div className="payment-problem__controls" aria-hidden="true">
                <span className="payment-problem__control">_</span>
                <span className="payment-problem__control">[]</span>
                <span className="payment-problem__control">X</span>
              </div>
            </div>

            <div className="payment-problem__menubar">
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
              <span>Favorites</span>
              <span>Tools</span>
              <span>Help</span>
            </div>

            <div className="payment-problem__toolbar" aria-hidden="true">
              <span className="payment-problem__tool">Back</span>
              <span className="payment-problem__tool">Forward</span>
              <span className="payment-problem__tool">Stop</span>
              <span className="payment-problem__tool">Refresh</span>
              <span className="payment-problem__tool">Home</span>
              <span className="payment-problem__tool">Search</span>
            </div>

            <div className="payment-problem__addressbar">
              <span className="payment-problem__addresslabel">Address</span>
              <div className="payment-problem__addressfield">http://{hostName}/</div>
              <button type="button" className="payment-problem__go">
                Go
              </button>
            </div> */}

            <div className="payment-problem__page">
              <div className="payment-problem__document">
                {/* <div className="payment-problem__stamp">ACCOUNT SUSPENDED</div> */}

                <div className="payment-problem__headline">
                  <div className="payment-problem__icon" aria-hidden="true">
                    !
                  </div>

                  <div>
                    <h1>The webpage is not available</h1>
                  </div>
                </div>

                <div className="payment-problem__rule" />

                <div className="payment-problem__columns">
                  <div className="payment-problem__panel">
                    <h2>Most likely causes:</h2>

                    <ul className="payment-problem__list">
                      <li>The hosting account for {hostName} has been suspended.</li>
                      <li>An overdue balance triggered an automatic service shutdown.</li>
                      <li>Public access will remain blocked until payment is confirmed.</li>
                    </ul>

                    <div className="payment-problem__console">
                      <div>
                        <strong>HTTP status:</strong> 404
                      </div>
                      <div>
                        <strong>Provider response:</strong> Hosting billing problem detected
                      </div>
                      <div>
                        <strong>Domain:</strong> {hostName}
                      </div>
                      <div>
                        <strong>Last checked:</strong> {checkedAt}
                      </div>
                      <div>
                        <strong>Access state:</strong> Service temporarily disabled
                      </div>
                    </div>
                  </div>

                  {/* <div className="payment-problem__panel">
                    <h2>What you can try:</h2>

                    <ul className="payment-problem__list">
                      <li>If you are the owner, renew the hosting plan immediately.</li>
                      <li>Contact your hosting provider to request account reactivation.</li>
                      <li>If you are a visitor, close this window and try again later.</li>
                    </ul>

                    <div className="payment-problem__note">
                      <strong>Site owner notice:</strong> This page is shown when a hosting
                      company disables web service because the invoice has not been paid.
                      Restore the account, wait for billing confirmation, then restart the
                      website.
                    </div>
                  </div> */}
                </div>
              </div>
            </div>

            <div className="payment-problem__statusbar">
              <div className="payment-problem__statuscell">Done</div>
              <div className="payment-problem__statuscell">Internet</div>
              <div className="payment-problem__statuscell">HTTP 402</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export { PaymentProblem };

export default PaymentProblem;
