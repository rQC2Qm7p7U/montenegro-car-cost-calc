import jsPDF from 'jspdf';
import type { CalculationResults } from '@/types/calculator';
import type { Language } from '@/types/language';
import { getContainerConfig } from '@/lib/carImport';

interface ExportParams {
  language: Language;
  results: CalculationResults;
  numberOfCars: number;
  scenario: 'physical' | 'company';
  customsDuty: number;
  vat: number;
  krwPerUsdRate: number;
  usdPerEurRate: number;
  containerType: '20ft' | '40ft';
}

export const exportCalculationPDF = ({
  language,
  results,
  numberOfCars,
  scenario,
  customsDuty,
  vat,
  krwPerUsdRate,
  usdPerEurRate,
  containerType,
}: ExportParams): void => {
  const isRu = language === "ru";
  const locale = isRu ? "ru-RU" : "en-US";
  const formatEUR = (value: number): string =>
    new Intl.NumberFormat(locale)
      .format(Math.round(value))
      .replace(/\u00A0/g, " ");
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(locale, options).format(value).replace(/\u00A0/g, " ");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const containerInfo = getContainerConfig(containerType);
  const scenarioLabel = scenario === 'company' ? (isRu ? 'компания' : 'company') : (isRu ? 'физлицо' : 'physical');

  const carsWithPrices = results.carResults.filter(car => car.carPrice > 0);
  const avgFinalCost = carsWithPrices.length > 0
    ? results.totalFinalCost / carsWithPrices.length
    : 0;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(isRu ? 'Анализ стоимости импорта' : 'Car Import Cost Analysis', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${isRu ? 'Создано' : 'Generated'}: ${new Date().toLocaleDateString(isRu ? 'ru-RU' : 'en-GB')} | ${containerType} ${isRu ? 'контейнер' : 'Container'} | ${carsWithPrices.length} ${isRu ? 'авто' : 'Vehicle(s)'}`,
    margin,
    35,
  );
  
  y = 55;

  // Executive Summary Box
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(37, 99, 235);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'FD');
  
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(isRu ? 'ИТОГОВАЯ СТОИМОСТЬ' : 'TOTAL IMPORT COST', margin + 10, y + 12);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`€${formatEUR(results.totalFinalCost)}`, margin + 10, y + 28);
  
  // Right side metrics
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${isRu ? 'Авто' : 'Vehicles'}: ${carsWithPrices.length}`, margin + 120, y + 14);
  doc.text(`${isRu ? 'Среднее/авто' : 'Avg. per car'}: €${formatEUR(avgFinalCost)}`, margin + 120, y + 22);
  doc.text(`${isRu ? 'Налоги' : 'Total taxes'}: €${formatEUR(results.totalCustoms + results.totalVAT)}`, margin + 120, y + 30);
  
  y += 50;

  // Company scenario note
  if (scenario === 'company') {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      isRu ? 'Сценарий компания — возврат НДС' : 'Company Scenario - VAT Refund Eligible',
      margin + 10,
      y + 9,
    );
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${isRu ? 'Итог' : 'Net Cost'}: €${formatEUR(results.totalNetCostForCompany)} | ${isRu ? 'Возврат НДС' : 'VAT Refund'}: €${formatEUR(results.totalVATRefund)}`,
      margin + 10,
      y + 16,
    );
    y += 28;
  }

  // Section: Cost Breakdown
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(isRu ? 'СТРУКТУРА РАСХОДОВ' : 'COST BREAKDOWN', margin, y);
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const addRow = (label: string, value: string, bold = false, indent = 0) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? 0 : 80, bold ? 0 : 80, bold ? 0 : 80);
    doc.text(label, margin + indent, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += 6;
  };

  addRow(
    `${isRu ? 'Покупка авто' : 'Vehicle Purchase'} (${carsWithPrices.length}×)`,
    `€${formatEUR(results.totalCarPrices)}`,
  );
  addRow(`${isRu ? 'Морской фрахт' : 'Sea Freight'} (${containerType})`, `€${formatEUR(results.freightPerContainerEUR)}`);
  
  y += 2;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 4, contentWidth, 8, 'F');
  addRow(isRu ? 'CIF стоимость' : 'CIF Value', `€${formatEUR(results.totalCIF)}`, true);
  y += 2;

  addRow(`${isRu ? 'Пошлина' : 'Customs Duty'} (${customsDuty}%)`, `€${formatEUR(results.totalCustoms)}`);
  addRow(`${isRu ? 'НДС' : 'VAT'} (${vat}%)`, `€${formatEUR(results.totalVAT)}`);
  
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(isRu ? 'Сервисы и сборы:' : 'Services & Fees:', margin, y);
  y += 5;

  addRow(isRu ? 'Порт и агент' : 'Port & Agent Fee', `€${formatEUR(results.portAgentFeePerCar * numberOfCars)}`, false, 5);
  addRow(
    `${isRu ? 'Экспедитор' : 'Speditor Fee'} (${numberOfCars}×)`,
    `€${formatEUR(results.speditorFee * numberOfCars)}`,
    false,
    5,
  );
  addRow(isRu ? 'Перевод' : 'Translation', `€${formatEUR(results.translationPerCar * numberOfCars)}`, false, 5);
  addRow(
    `${isRu ? 'Гомологация' : 'Homologation'} (${numberOfCars}×)`,
    `€${formatEUR((results.carResults[0]?.homologationFee || 0) * numberOfCars)}`,
    false,
    5,
  );
  
  if (results.carResults[0]?.miscellaneous > 0) {
    addRow(
      `${isRu ? 'Прочие расходы' : 'Miscellaneous'} (${numberOfCars}×)`,
      `€${formatEUR(results.carResults[0].miscellaneous * numberOfCars)}`,
      false,
      5,
    );
  }

  y += 4;
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y - 4, contentWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(isRu ? 'ИТОГО' : 'GRAND TOTAL', margin + 5, y + 2);
  doc.text(`€${formatEUR(results.totalFinalCost)}`, pageWidth - margin - 5, y + 2, { align: 'right' });
  y += 16;

  // Per Vehicle Section
  if (y > 200) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(isRu ? 'ПО КАЖДОМУ АВТО' : 'PER VEHICLE BREAKDOWN', margin, y);
  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  carsWithPrices.forEach((car, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y - 4, contentWidth, 50, 2, 2, 'F');

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${isRu ? 'Авто №' : 'Vehicle #'}${car.carIndex}`, margin + 5, y + 4);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`${isRu ? 'Итого' : 'Total'}: €${formatEUR(car.finalCost)}`, pageWidth - margin - 5, y + 4, { align: 'right' });

    y += 12;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    const col1 = margin + 5;
    const col2 = margin + 55;
    const col3 = margin + 105;

    doc.text(`${isRu ? 'Покупка' : 'Purchase'}: €${formatEUR(car.carPrice)}`, col1, y);
    doc.text(`CIF: €${formatEUR(car.cif)}`, col2, y);
    doc.text(`${isRu ? 'Пошлина' : 'Customs'}: €${formatEUR(car.customs)}`, col3, y);
    y += 6;

    doc.text(`${isRu ? 'НДС' : 'VAT'}: €${formatEUR(car.vatAmount)}`, col1, y);
    doc.text(`${isRu ? 'Фрахт' : 'Freight'}: €${formatEUR(car.freightPerCar)}`, col2, y);
    doc.text(`${isRu ? 'Сервисы' : 'Services'}: €${formatEUR(car.portAgentFeePerCar + car.translationPerCar + car.speditorFee)}`, col3, y);
    y += 6;

    doc.text(`${isRu ? 'Гомологация' : 'Homologation'}: €${formatEUR(car.homologationFee)}`, col1, y);
    if (car.miscellaneous > 0) {
      doc.text(`${isRu ? 'Прочее' : 'Misc'}: €${formatEUR(car.miscellaneous)}`, col2, y);
    }

    if (scenario === 'company') {
      doc.setTextColor(22, 101, 52);
      doc.text(
        `${isRu ? 'Итог (с возвратом НДС)' : 'Net Cost (VAT refund)'}: €${formatEUR(car.netCostForCompany)}`,
        col3,
        y,
      );
    }

    y += 18;
  });

  // Footer - Parameters
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  
  doc.text(isRu ? 'Параметры расчета:' : 'Calculation Parameters:', margin, y);
  y += 5;
  doc.text(
    `${isRu ? 'Контейнер' : 'Container'}: ${containerType} | ${isRu ? 'Пошлина' : 'Customs'}: ${customsDuty}% | ${isRu ? 'НДС' : 'VAT'}: ${vat}% | ${isRu ? 'Сценарий' : 'Scenario'}: ${scenarioLabel}`,
    margin,
    y,
  );
  y += 5;
  doc.text(
    `${isRu ? 'Курсы валют' : 'Exchange Rates'}: $1 = ${formatNumber(Math.round(krwPerUsdRate))} KRW | €1 = $${formatNumber(usdPerEurRate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
    margin,
    y,
  );

  // Save
  const fileName = `car-import-calculation-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
