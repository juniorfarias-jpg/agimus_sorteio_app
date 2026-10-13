import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Raffle } from '../types.ts';

export function exportParticipantsPDF(
  raffle: Raffle,
  participants: Array<{
    ticketNumber: string;
    name: string;
    email?: string;
    emailMasked: string;
    city: string;
    registeredAt: string;
  }>
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header Banner
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SorteioLive • Relatório Oficial de Inscritos (Admin)', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Evento: ${raffle.title}`, 14, 22);
  doc.text(`Organizador: ${raffle.settings?.organizerName || 'Comissão Oficial'}`, 14, 27);

  // Subtitle info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.text(`Data de Emissão: ${currentDate}`, 14, 38);
  doc.text(`Total de Participantes Auditados: ${participants.length}`, 14, 43);

  // Table Data with full unmasked email for administrator
  const tableRows = participants.map((p, index) => {
    const isWinner = raffle.winners.some((w) => w.ticketNumber === p.ticketNumber);
    const dateFormatted = p.registeredAt
      ? new Date(p.registeredAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    return [
      String(index + 1),
      p.ticketNumber,
      p.name,
      p.email || p.emailMasked, // Full unmasked email for administrator
      p.city || '-',
      dateFormatted,
      isWinner ? '🏆 Premiado' : 'Validado ✓',
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [['#', 'Nº Bilhete', 'Nome do Participante', 'E-mail Completo', 'Cidade/UF', 'Data Inscrição', 'Status']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [67, 56, 202], // Indigo-700
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 38 },
      4: { cellWidth: 28 },
      5: { cellWidth: 26 },
      6: { cellWidth: 20, fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount} • Documento gerado pelo sistema SorteioLive com validação criptográfica de unicidade`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    },
  });

  const cleanFilename = raffle.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  doc.save(`relatorio-participantes-${cleanFilename}.pdf`);
}

export function exportWinnersPDF(
  raffle: Raffle,
  participants?: Array<{ id: string; ticketNumber: string; email?: string; emailMasked?: string }>
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Top decorative bar
  doc.setFillColor(180, 83, 9); // Amber-700
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 6, pageWidth, 36, 'F');

  doc.setTextColor(251, 191, 36); // Amber-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DOCUMENTO PÚBLICO OFICIAL • TERMO DE HOMOLOGAÇÃO', 14, 16);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('ATA OFICIAL DE APURAÇÃO E GANHADORES', 14, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Sorteio: ${raffle.title}`, 14, 32);
  doc.text(`Organização: ${raffle.settings?.organizerName || 'Comissão Organizadora Oficial'}`, 14, 37);

  // Formal Introduction Text
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const introText =
    `Certificamos e tornamos público para os devidos fins de direito que em ${currentDate}, realizou-se a apuração oficial do evento "${raffle.title}". Todos os bilhetes foram devidamente validados por e-mail com inscrição única individual e conferência de autenticidade por QR Code. A seguir, lavra-se a relação definitiva e soberana dos contemplados:`;

  const splitIntro = doc.splitTextToSize(introText, pageWidth - 28);
  doc.text(splitIntro, 14, 49);

  // Table of Winners with full unmasked email for official validation
  const winnersRows = raffle.prizes.map((prize) => {
    const winner = raffle.winners.find((w) => w.prizeId === prize.id);
    const dateFormatted = winner?.drawnAt
      ? new Date(winner.drawnAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Aguardando Sorteio';

    let winnerEmail = '-';
    if (winner) {
      winnerEmail =
        winner.participantEmail ||
        participants?.find((p) => p.ticketNumber === winner.ticketNumber || p.id === winner.participantId)?.email ||
        winner.participantEmailMasked;
    }

    return [
      `${prize.rank}º Lugar`,
      prize.title,
      winner ? winner.ticketNumber : '-',
      winner ? winner.participantName : 'Pendente de Apuração',
      winnerEmail,
      dateFormatted,
    ];
  });

  autoTable(doc, {
    startY: 68,
    head: [['Colocação', 'Prêmio Oficial', 'Nº Bilhete', 'Nome do Contemplado', 'E-mail do Ganhador', 'Data/Hora Apuração']],
    body: winnersRows,
    theme: 'grid',
    headStyles: {
      fillColor: [180, 83, 9], // Amber-700
      textColor: 255,
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 24, fontStyle: 'bold', textColor: [180, 83, 9] },
      3: { cellWidth: 36 },
      4: { cellWidth: 38 },
      5: { cellWidth: 24, fontSize: 7.5 },
    },
  });

  // Final Signature Block
  const finalY = (doc as any).lastAutoTable.finalY + 18;

  if (finalY < 240) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text('E para constar a fidelidade do sorteio, firma-se o presente instrumento de homologação:', 14, finalY);

    // Signature 1
    doc.setDrawColor(120, 120, 120);
    doc.line(14, finalY + 22, 95, finalY + 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Presidente da Comissão Organizadora', 14, finalY + 26);
    doc.setFont('helvetica', 'normal');
    doc.text(raffle.settings?.organizerName || 'Organizador Responsável', 14, finalY + 30);

    // Signature 2
    doc.line(115, finalY + 22, 196, finalY + 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Auditoria de Transparência & Sistema', 115, finalY + 26);
    doc.setFont('helvetica', 'normal');
    doc.text('Verificação Digital SorteioLive', 115, finalY + 30);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Ata Oficial emitida em ${currentDate} • Registro autêntico e inalterável com validação única por e-mail e QR Code`,
    14,
    pageHeight - 10
  );

  const cleanFilename = raffle.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  doc.save(`ata-oficial-ganhadores-${cleanFilename}.pdf`);
}
