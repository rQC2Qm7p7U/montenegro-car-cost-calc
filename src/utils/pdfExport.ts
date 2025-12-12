import jsPDF from 'jspdf';
import type { CalculationResults } from '@/types/calculator';

interface ExportParams {
  results: CalculationResults;
  numberOfCars: number;
  scenario: 'physical' | 'company';
  customsDuty: number;
  vat: number;
  krwToEurRate: number;
  usdToEurRate: number;
  containerType: '20ft' | '40ft';
}

const formatEUR = (value: number): string => {
  return Math.round(value).toLocaleString('de-DE');
};

export const exportCalculationPDF = ({
  results,
  numberOfCars,
  scenario,
  customsDuty,
  vat,
  krwToEurRate,
  usdToEurRate,
  containerType,
}: ExportParams): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const containerInfo = containerType === '20ft'
    ? { freightUSD: 3150, localEUR: 350 }
    : { freightUSD: 4150, localEUR: 420 };

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
  doc.text('Car Import Cost Analysis', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} | ${containerType} Container | ${carsWithPrices.length} Vehicle(s)`, margin, 35);
  
  y = 55;

  // Executive Summary Box
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(37, 99, 235);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'FD');
  
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL IMPORT COST', margin + 10, y + 12);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`€${formatEUR(results.totalFinalCost)}`, margin + 10, y + 28);
  
  // Right side metrics
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Vehicles: ${carsWithPrices.length}`, margin + 120, y + 14);
  doc.text(`Avg. per car: €${formatEUR(avgFinalCost)}`, margin + 120, y + 22);
  doc.text(`Total taxes: €${formatEUR(results.totalCustoms + results.totalVAT)}`, margin + 120, y + 30);
  
  y += 50;

  // Company scenario note
  if (scenario === 'company') {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Scenario - VAT Refund Eligible', margin + 10, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Net Cost: €${formatEUR(results.totalNetCostForCompany)} | VAT Refund: €${formatEUR(results.totalVATRefund)}`, margin + 10, y + 16);
    y += 28;
  }

  // Section: Cost Breakdown
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('COST BREAKDOWN', margin, y);
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

  addRow(`Vehicle Purchase (${carsWithPrices.length}×)`, `€${formatEUR(results.totalCarPrices)}`);
  addRow(`Sea Freight (${containerType})`, `€${formatEUR(results.freightPerContainerEUR)}`);
  
  y += 2;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 4, contentWidth, 8, 'F');
  addRow('CIF Value', `€${formatEUR(results.totalCIF)}`, true);
  y += 2;

  addRow(`Customs Duty (${customsDuty}%)`, `€${formatEUR(results.totalCustoms)}`);
  addRow(`VAT (${vat}%)`, `€${formatEUR(results.totalVAT)}`);
  
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Services & Fees:', margin, y);
  y += 5;

  addRow('Port & Agent Fee', `€${formatEUR(results.portAgentFeePerCar * numberOfCars)}`, false, 5);
  addRow(`Speditor Fee (${numberOfCars}×)`, `€${formatEUR(results.speditorFee * numberOfCars)}`, false, 5);
  addRow('Translation', `€${formatEUR(results.translationPerCar * numberOfCars)}`, false, 5);
  addRow(`Homologation (${numberOfCars}×)`, `€${formatEUR((results.carResults[0]?.homologationFee || 0) * numberOfCars)}`, false, 5);
  
  if (results.carResults[0]?.miscellaneous > 0) {
    addRow(`Miscellaneous (${numberOfCars}×)`, `€${formatEUR(results.carResults[0].miscellaneous * numberOfCars)}`, false, 5);
  }

  y += 4;
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y - 4, contentWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', margin + 5, y + 2);
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
  doc.text('PER VEHICLE BREAKDOWN', margin, y);
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
    doc.text(`Vehicle #${car.carIndex}`, margin + 5, y + 4);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`Total: €${formatEUR(car.finalCost)}`, pageWidth - margin - 5, y + 4, { align: 'right' });

    y += 12;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    const col1 = margin + 5;
    const col2 = margin + 55;
    const col3 = margin + 105;

    doc.text(`Purchase: €${formatEUR(car.carPrice)}`, col1, y);
    doc.text(`CIF: €${formatEUR(car.cif)}`, col2, y);
    doc.text(`Customs: €${formatEUR(car.customs)}`, col3, y);
    y += 6;

    doc.text(`VAT: €${formatEUR(car.vatAmount)}`, col1, y);
    doc.text(`Freight: €${formatEUR(car.freightPerCar)}`, col2, y);
    doc.text(`Services: €${formatEUR(car.portAgentFeePerCar + car.translationPerCar + car.speditorFee)}`, col3, y);
    y += 6;

    doc.text(`Homologation: €${formatEUR(car.homologationFee)}`, col1, y);
    if (car.miscellaneous > 0) {
      doc.text(`Misc: €${formatEUR(car.miscellaneous)}`, col2, y);
    }

    if (scenario === 'company') {
      doc.setTextColor(22, 101, 52);
      doc.text(`Net Cost (VAT refund): €${formatEUR(car.netCostForCompany)}`, col3, y);
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
  
  doc.text('Calculation Parameters:', margin, y);
  y += 5;
  doc.text(`Container: ${containerType} | Customs: ${customsDuty}% | VAT: ${vat}% | Scenario: ${scenario}`, margin, y);
  y += 5;
  doc.text(`Exchange Rates: 1 EUR = ${Math.round(1 / krwToEurRate).toLocaleString('de-DE')} KRW | 1 USD = ${usdToEurRate.toFixed(4)} EUR`, margin, y);

  // Save
  const fileName = `car-import-calculation-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
