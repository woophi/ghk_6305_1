import { AmountInput } from '@alfalab/core-components/amount-input';
import { BottomSheet } from '@alfalab/core-components/bottom-sheet';
import { ButtonMobile } from '@alfalab/core-components/button/mobile';
import { CalendarMobile } from '@alfalab/core-components/calendar/mobile';
import { Divider } from '@alfalab/core-components/divider';
import { Gap } from '@alfalab/core-components/gap';
import { Input } from '@alfalab/core-components/input';
import { Spinner } from '@alfalab/core-components/spinner';
import { Status } from '@alfalab/core-components/status';
import { Typography } from '@alfalab/core-components/typography';
import { CalendarMIcon } from '@alfalab/icons-glyph/CalendarMIcon';
import { ChevronLeftMIcon } from '@alfalab/icons-glyph/ChevronLeftMIcon';
import { ChevronRightMIcon } from '@alfalab/icons-glyph/ChevronRightMIcon';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import checkedImg from './assets/checked.svg';
import uncheckedImg from './assets/unchecked.svg';
import { LS, LSKeys } from './ls';
import { appSt } from './style.css';
import { calcBonds, calcDeposit, calcGold, calcIISA, calcIISBase, calcPiggy, calcStocks } from './utils/calculator';
import { sendDataToGA } from './utils/events';

enum ProductType {
  Deposit = 'deposit',
  Obligations = 'obligations',
  Stocks = 'stocks',
  Gold = 'gold',
  Piggy = 'piggy',
  IIS_A = 'iis_a',
  IIS_Base = 'iis_base',
}

const productTypeToTitle: Record<ProductType, string> = {
  [ProductType.Deposit]: 'Депозит',
  [ProductType.Obligations]: 'Облигации',
  [ProductType.Stocks]: 'Акции',
  [ProductType.Gold]: 'Золото',
  [ProductType.Piggy]: 'Инвесткопилка',
  [ProductType.IIS_A]: 'ИИС тип А',
  [ProductType.IIS_Base]: 'ИИС (базовая)',
};

const productTypeToLink: Record<ProductType, string> = {
  [ProductType.Deposit]: 'alfabank://deposits_opening',
  [ProductType.Obligations]: 'Облигации',
  [ProductType.Stocks]: 'Акции',
  [ProductType.Gold]: 'Золото',
  [ProductType.Piggy]: 'alfabank://investments/open_investments_account?type=BS',
  [ProductType.IIS_A]: 'alfabank://investments/open_investments_account?type=IIS',
  [ProductType.IIS_Base]: 'alfabank://accounts_opening_details?accountType=IY&conditions=BASIC',
};

const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

const calcByProductType = {
  [ProductType.Deposit]: calcDeposit,
  [ProductType.Obligations]: calcBonds,
  [ProductType.Stocks]: calcStocks,
  [ProductType.Gold]: calcGold,
  [ProductType.Piggy]: calcPiggy,
  [ProductType.IIS_A]: calcIISA,
  [ProductType.IIS_Base]: calcIISBase,
};

const LINK = 'alfabank://investments/open_investments_account?type=BS';

export const App = () => {
  const [loading, setLoading] = useState(false);
  const [openBs, setOpenBs] = useState(false);
  const [sum, setSum] = useState(10000);
  const [error, setError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [calendarValue, setCalendarValue] = useState<{ dateFrom?: number; dateTo?: number }>({});
  const [selectedProducts, setSelectedProducts] = useState<ProductType[]>([]);
  const [view, setView] = useState<'list' | 'calc'>('list');

  useEffect(() => {
    if (!LS.getItem(LSKeys.UserId, null)) {
      LS.setItem(LSKeys.UserId, Date.now());
    }
  }, []);
  useEffect(() => {
    if (selectedProducts.length > 0 && productsError) {
      setProductsError(null);
    }
  }, [selectedProducts.length > 0]);
  useEffect(() => {
    if (!!calendarValue.dateFrom && !!calendarValue.dateTo && periodError) {
      setPeriodError(null);
    }
  }, [!!calendarValue.dateFrom && !!calendarValue.dateTo]);

  const goNext = () => {
    if (!sum) {
      setError('Введите сумму вложений');
      return;
    }
    if (!calendarValue.dateFrom || !calendarValue.dateTo) {
      setPeriodError('Введите период');
      return;
    }
    if (selectedProducts.length === 0) {
      setProductsError('Выберите тип продукта');
      return;
    }
    window.gtag('event', '6305_calculate');
    setView('calc');
  };

  const goToSelectProduct = () => {
    setOpenBs(true);
    window.gtag('event', '6305_calculate');
  };
  const selectProductSubmit = (product: ProductType) => {
    setLoading(true);
    sendDataToGA({
      sum,
      period: `${dayjs(calendarValue.dateFrom).format('DD.MM.YYYY')} - ${dayjs(calendarValue.dateTo).format('DD.MM.YYYY')}`,
      product: productTypeToTitle[product],
    }).then(() => {
      window.location.replace(productTypeToLink[product]);
    });
  };

  const handleChangeInput = (_: React.ChangeEvent<HTMLInputElement>, { value }: { value: number | null }) => {
    if (error) {
      setError('');
    }

    setSum(value ?? 0);
  };

  if (view === 'calc') {
    const calcResults = selectedProducts.map(product => {
      const results = calcByProductType[product]({
        S: sum,
        Tm: dayjs(calendarValue.dateTo).diff(dayjs(calendarValue.dateFrom), 'month'),
      });
      return {
        key: product,
        results,
      };
    });
    const maxFinalAmount = calcResults.find(
      r => r.results.finalAmount === Math.max(...calcResults.map(c => c.results.finalAmount)),
    );
    return (
      <>
        <div className={appSt.container}>
          <Typography.TitleResponsive style={{ marginTop: '1rem' }} tag="h1" view="medium" font="system" weight="medium">
            Рассчет
          </Typography.TitleResponsive>
          <Typography.Text view="primary-medium">
            Расчёт калькулятора предварительный. Персональные условия вы сможете узнать после оформления заявки
          </Typography.Text>

          {selectedProducts.map(product => {
            const calc = calcResults.find(r => r.key === product)!.results;

            return (
              <div key={product} className={appSt.box}>
                <div className={appSt.row}>
                  <Typography.TitleResponsive tag="h2" view="xsmall" font="system" weight="bold">
                    {productTypeToTitle[product]}
                  </Typography.TitleResponsive>

                  {maxFinalAmount?.key === product ? (
                    <Status view="contrast" color="green" size={20}>
                      <Typography.Text view="secondary-small" weight="bold">
                        Лучшая прибыль
                      </Typography.Text>
                    </Status>
                  ) : (
                    <div></div>
                  )}
                </div>
                <Divider />
                <div className={appSt.row}>
                  <Typography.Text view="secondary-medium" tag="p" defaultMargins={false}>
                    Сумма в конце срока
                  </Typography.Text>
                  <Typography.TitleResponsive tag="h3" view="xsmall" font="system" weight="semibold">
                    +{calc.finalAmount.toLocaleString('ru-RU')}
                  </Typography.TitleResponsive>
                </div>
                <Divider />
                <div className={appSt.row}>
                  <Typography.Text view="secondary-medium" tag="p" defaultMargins={false}>
                    Доход
                  </Typography.Text>
                  <Typography.TitleResponsive tag="h3" view="xsmall" font="system" weight="semibold">
                    +{calc.profit.toLocaleString('ru-RU')}
                  </Typography.TitleResponsive>
                </div>
                <Divider />
                <div className={appSt.row}>
                  <Typography.Text view="secondary-medium" tag="p" defaultMargins={false}>
                    Доход, %
                  </Typography.Text>
                  <Typography.TitleResponsive tag="h3" view="xsmall" font="system" weight="semibold">
                    {calc.profitPercents.toLocaleString('ru-RU')} %
                  </Typography.TitleResponsive>
                </div>
                <Divider />
                <div className={appSt.row}>
                  <Typography.Text view="secondary-medium" tag="p" defaultMargins={false}>
                    Доход с учетом инфляции
                  </Typography.Text>
                  <Typography.TitleResponsive tag="h3" view="xsmall" font="system" weight="semibold">
                    {calc.annualizedPercent.toLocaleString('ru-RU')} %
                  </Typography.TitleResponsive>
                </div>
              </div>
            );
          })}
          <Gap size={96} />
        </div>
        <div className={appSt.bottomBtn}>
          <ButtonMobile
            view="secondary"
            size={56}
            style={{ minWidth: 56, maxWidth: 56 }}
            onClick={() => {
              setView('list');
            }}
          >
            <ChevronLeftMIcon width={24} height={24} />
          </ButtonMobile>
          <ButtonMobile block view="primary" size={56} onClick={goToSelectProduct} loading={loading}>
            Открыть продукт
          </ButtonMobile>
        </div>

        <BottomSheet
          hasCloser
          stickyHeader
          open={openBs}
          onClose={() => setOpenBs(false)}
          title="Выберите продукт"
          contentClassName={appSt.btmContent}
        >
          <div className={appSt.container}>
            {selectedProducts.map(product => (
              <div
                key={product}
                className={appSt.cell({})}
                onClick={() => {
                  if (!loading) {
                    selectProductSubmit(product);
                  }
                }}
              >
                <Typography.Text view="primary-medium">{productTypeToTitle[product]}</Typography.Text>
                <ChevronRightMIcon />
              </div>
            ))}
            {loading ? <Spinner style={{ margin: '0 auto', height: '24px' }} visible preset={24} /> : <Gap size={24} />}
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <>
      <div className={appSt.container}>
        <Typography.TitleResponsive style={{ marginTop: '1rem' }} tag="h1" view="medium" font="system" weight="medium">
          Сравните доходность инвестиций за минуту
        </Typography.TitleResponsive>
        <Typography.Text view="primary-medium">Выберите сумму, срок и инструменты — получите расчет</Typography.Text>

        <div style={{ marginTop: '12px' }}>
          <AmountInput
            label="Сумма вложений"
            labelView="outer"
            value={sum}
            error={error}
            onChange={handleChangeInput}
            block
            minority={1}
            bold={false}
            min={1000}
            max={1_000_000_000}
            positiveOnly
            integersOnly
            onBlur={() => {
              if (sum < 1000) {
                setSum(1000);
              } else if (sum > 1_000_000_000) {
                setSum(1_000_000_000);
              }
            }}
          />
        </div>
        <div style={{ marginTop: '12px' }}>
          <Input
            label="Период"
            labelView="outer"
            value={
              calendarValue.dateFrom && calendarValue.dateTo
                ? `${dayjs(calendarValue.dateFrom).format('DD.MM.YYYY')} - ${dayjs(calendarValue.dateTo).format(
                    'DD.MM.YYYY',
                  )}`
                : undefined
            }
            block
            rightAddons={<CalendarMIcon color="#898991" />}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setOpenCalendar(true);
            }}
            error={periodError}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
            Тип продукта
          </Typography.Text>
          {productsError && (
            <Typography.Text view="primary-small" color="accent">
              {productsError}
            </Typography.Text>
          )}
        </div>

        {getKeys(ProductType).map(key => (
          <div
            key={key}
            className={appSt.cell({ selected: selectedProducts.includes(ProductType[key]) })}
            onClick={() => {
              setSelectedProducts(prev =>
                prev.includes(ProductType[key]) ? prev.filter(p => p !== ProductType[key]) : [...prev, ProductType[key]],
              );
            }}
          >
            <Typography.Text view="primary-medium">{productTypeToTitle[ProductType[key]]}</Typography.Text>
            <img src={selectedProducts.includes(ProductType[key]) ? checkedImg : uncheckedImg} alt="" />
          </div>
        ))}
      </div>
      <Gap size={96} />

      <div className={appSt.bottomBtn}>
        <ButtonMobile loading={loading} block view="primary" onClick={goNext}>
          Рассчитать
        </ButtonMobile>
      </div>

      <CalendarMobile
        mode="range"
        rangeBehavior="clarification"
        value={calendarValue}
        onChange={(dateFrom, dateTo) => setCalendarValue({ dateFrom, dateTo })}
        onClose={() => setOpenCalendar(false)}
        open={openCalendar}
        selectorView="full"
        minDate={dayjs().toDate().getTime()}
        maxDate={dayjs().add(10, 'year').toDate().getTime()}
      />
    </>
  );
};
