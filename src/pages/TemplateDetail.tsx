import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Edit, Copy, CheckCircle2 } from 'lucide-react';
import { apiFetch, createTemplate } from '@/lib/api';
import contourMapSvg from '@/assets/contour_map(2).svg';
import { Alert, AlertContent, AlertDescription, AlertIcon } from '@/components/ui/alert-1';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [duplicating, setDuplicating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const templates = {
    '1': {
      name: 'Simple Invoice',
      description: 'Clean & minimal design for basic invoicing',
      color: 'from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30',
      accent: 'blue',
      features: [
        'Clean, minimal layout',
        'Essential invoice fields only',
        'Perfect for service businesses',
        'Quick setup and customization',
        'Professional appearance'
      ],
      preview: 'simple'
    },
    '2': {
      name: 'Detailed Invoice',
      description: 'Comprehensive layout with itemized billing',
      color: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30',
      accent: 'emerald',
      features: [
        'Detailed itemization',
        'Multiple tax rates support',
        'Quantity and unit pricing',
        'Subtotals and calculations',
        'Professional branding area'
      ],
      preview: 'detailed'
    },
    '3': {
      name: 'Pro-forma Invoice',
      description: 'Professional estimates and quotes',
      color: 'from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30',
      accent: 'purple',
      features: [
        'Quote and estimate format',
        'Terms and conditions section',
        'Validity period display',
        'Professional presentation',
        'Easy conversion to invoice'
      ],
      preview: 'proforma'
    }
  };

  const template = templates[id as keyof typeof templates];

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Template Not Found</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">The template you're looking for doesn't exist.</p>
          <Link to="/dashboard/templates" className="text-blue-600 hover:underline">
            ← Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  const handleUseTemplate = () => {
    navigate(`/dashboard/create-invoice?template=${id}`);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const node = previewRef.current;
      if (!node) throw new Error('Preview not available');

      // Render the preview DOM to a canvas at higher scale for sharpness
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (doc) => {
          // Ensure the cloned element is visible and not scaled down
          const el = doc.getElementById('template-preview');
          if (el) {
            el.classList.remove('scale-90');
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');

      // Create A4 PDF in portrait; size in pt (1/72 inch)
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fit image within page while preserving aspect ratio
      const imgWidth = pageWidth - 48; // margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let y = 24;
      if (imgHeight > pageHeight - 48) {
        // Multiple pages
        let hLeft = imgHeight;
        let position = 24;
        while (hLeft > 0) {
          pdf.addImage(imgData, 'PNG', 24, position, imgWidth, imgHeight);
          hLeft -= pageHeight;
          if (hLeft > 0) {
            pdf.addPage();
            position = 24 - (imgHeight - hLeft);
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 24, y, imgWidth, imgHeight);
      }

      pdf.save(`${template.name.replace(/\s+/g, '_')}.pdf`);
      setSuccessMsg('PDF exported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setSuccessMsg('Error generating PDF. Please try again.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setDownloading(false);
    }
  };

  // removed unused createSimplePDF helper


  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      // Build template payload based on the selected built-in preview
      let name = `${template.name} (Copy)`;
      let tax_rate = 0;
      let notes = template.description as string | undefined;
      let items: Array<{ description: string; quantity: number; rate: number }> = [];

      if (template.preview === 'simple') {
        // Matches the Simple preview content
        items = [
          { description: 'Web Development Services', quantity: 1, rate: 2500.00 },
        ];
        tax_rate = 0;
      } else if (template.preview === 'detailed') {
        // Matches the Detailed preview table and tax shown (8.5%)
        items = [
          { description: 'Website Design & Development', quantity: 1, rate: 2500.00 },
          { description: 'SEO Optimization', quantity: 1, rate: 500.00 },
        ];
        tax_rate = 8.5;
      } else if (template.preview === 'proforma') {
        // Pro-forma example services, no tax by default
        items = [
          { description: 'Complete Brand Identity Package', quantity: 1, rate: 3500.00 },
          { description: 'Website Development', quantity: 1, rate: 4200.00 },
        ];
        tax_rate = 0;
        notes = 'This quote is valid for 30 days. Final invoice may vary based on scope changes.';
      }

      // Create the template on the backend
      await createTemplate({ name, items, tax_rate, notes });

      setSuccessMsg('Template duplicated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      // Navigate back to templates so the user sees it listed
      setTimeout(() => navigate('/dashboard/templates'), 600);
    } catch (error) {
      console.error('Error duplicating template:', error);
      setSuccessMsg('Failed to duplicate template.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setDuplicating(false);
    }
  };

  // Load company logo URL for preview/PDF branding
  useEffect(() => {
    const run = async () => {
      try {
        const res = await apiFetch('/api/settings/company-logo-url');
        if (res.ok) {
          const data = await res.json();
          setLogoUrl(data?.url || null);
        }
      } catch {
        // ignore logo errors
      }
    };
    run();
  }, []);

  const renderPreview = () => {
    const baseClasses = "bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 border border-neutral-200 dark:border-neutral-700";
    
    if (template.preview === 'simple') {
      return (
        <div className={baseClasses}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="h-12 w-12 object-contain" />
              ) : (
                <div className="h-12 w-12 bg-neutral-200 rounded" />
              )}
              <div>
                <div className="text-lg font-semibold">Your Company LLC</div>
                <div className="text-sm text-neutral-500">hello@company.com</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">INVOICE</div>
              <div className="text-sm text-neutral-500">#INV-001</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-sm text-neutral-500 mb-1">Bill To</div>
              <div className="font-medium">Client Name</div>
              <div className="text-sm text-neutral-600">client@example.com</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-500 mb-1">Date</div>
              <div className="font-medium">2025-08-25</div>
            </div>
          </div>

          <div className="">
            <div className="flex justify-between py-3 border-t border-neutral-200">
              <div>Service</div>
              <div className="font-medium">$2,500.00</div>
            </div>
            <div className="flex justify-between py-3 border-t border-neutral-200">
              <div className="font-semibold">Total</div>
              <div className="font-semibold">$2,500.00</div>
            </div>
          </div>
        </div>
      );
    }

    if (template.preview === 'detailed') {
      return (
        <div className={baseClasses}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="h-12 w-12 object-contain" />
              ) : (
                <div className="h-12 w-12 bg-neutral-200 rounded" />
              )}
              <div>
                <div className="text-lg font-semibold">Your Company LLC</div>
                <div className="text-sm text-neutral-500">hello@company.com</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">INVOICE</div>
              <div className="text-sm text-neutral-500">#INV-2024-001</div>
              <div className="text-sm text-neutral-500">Date: March 15, 2024</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <div className="text-sm text-neutral-500 mb-2">Bill From</div>
              <div className="text-sm text-neutral-600">
                <p className="font-medium">Your Company Name</p>
                <p>123 Business Street</p>
                <p>Suite 100</p>
                <p>City, State 12345</p>
                <p>contact@company.com</p>
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 mb-2">Bill To</div>
              <div className="text-sm text-neutral-600">
                <p className="font-medium">Client Company</p>
                <p>456 Client Avenue</p>
                <p>Floor 5</p>
                <p>City, State 67890</p>
                <p>billing@client.com</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 font-semibold text-neutral-900 dark:text-neutral-100">Item</th>
                  <th className="text-center py-3 font-semibold text-neutral-900 dark:text-neutral-100">Qty</th>
                  <th className="text-right py-3 font-semibold text-neutral-900 dark:text-neutral-100">Rate</th>
                  <th className="text-right py-3 font-semibold text-neutral-900 dark:text-neutral-100">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 text-neutral-600">Website Design & Development</td>
                  <td className="text-center py-3 text-neutral-600">1</td>
                  <td className="text-right py-3 text-neutral-600">$2,500.00</td>
                  <td className="text-right py-3 text-neutral-600">$2,500.00</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 text-neutral-600">SEO Optimization</td>
                  <td className="text-center py-3 text-neutral-600">1</td>
                  <td className="text-right py-3 text-neutral-600">$500.00</td>
                  <td className="text-right py-3 text-neutral-600">$500.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-80">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span>$3,000.00</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Tax (8.5%):</span>
                  <span>$255.00</span>
                </div>
                <div className="flex justify-between py-2 border-t border-neutral-200 font-semibold text-neutral-900 dark:text-neutral-100">
                  <span>Total:</span>
                  <span>$3,255.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (template.preview === 'proforma') {
      return (
        <div className={baseClasses}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="h-12 w-12 object-contain" />
              ) : (
                <div className="h-12 w-12 bg-neutral-200 rounded" />
              )}
              <div>
                <div className="text-lg font-semibold">Professional Services Inc.</div>
                <div className="text-sm text-neutral-500">quotes@professional.com</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">PRO-FORMA INVOICE</div>
              <div className="text-sm text-neutral-500">Quote #QT-2024-001</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-sm text-neutral-500 mb-3">From:</div>
              <div className="text-neutral-600 dark:text-neutral-400">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">Professional Services Inc.</p>
                <p>789 Corporate Blvd</p>
                <p>Business District</p>
                <p>Metro City, ST 54321</p>
                <p className="mt-2">Phone: (555) 123-4567</p>
                <p>Email: quotes@professional.com</p>
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 mb-3">To:</div>
              <div className="text-neutral-600 dark:text-neutral-400">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">Prospective Client LLC</p>
                <p>321 Client Plaza</p>
                <p>Suite 200</p>
                <p>Client City, ST 98765</p>
              </div>
              <div className="mt-4 text-sm">
                <p><span className="font-medium text-neutral-900 dark:text-neutral-100">Quote Date:</span> March 15, 2024</p>
                <p><span className="font-medium text-neutral-900 dark:text-neutral-100">Valid Until:</span> April 15, 2024</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Proposed Services:</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">Complete Brand Identity Package</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Logo design, brand guidelines, and collateral</p>
                </div>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">$3,500.00</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">Website Development</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Responsive design with CMS integration</p>
                </div>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">$4,200.00</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <div className="w-80">
              <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded">
                <div className="flex justify-between py-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  <span>Total Estimate:</span>
                  <span>$7,700.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            <p>This quote is valid for 30 days from the date above.</p>
            <p>Final invoice may vary based on project scope changes.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 relative">
      {/* Background SVG */}
      <div className="fixed inset-0 pointer-events-none">
        <img 
          src={contourMapSvg} 
          alt="" 
          className="w-full h-full object-cover opacity-[0.02] dark:opacity-[0.01]"
        />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative z-10">
        {/* Success Message */}
        {successMsg && (
          <div className="mb-6">
            <Alert variant="success" appearance="light" size="sm">
              <AlertIcon>
                <CheckCircle2 />
              </AlertIcon>
              <AlertContent>
                <AlertDescription>
                  {successMsg}
                </AlertDescription>
              </AlertContent>
            </Alert>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                {template.name}
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                {template.description}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button 
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Generating...' : 'Export PDF'}
              </button>
              <button 
                onClick={handleDuplicate}
                disabled={duplicating}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                {duplicating ? 'Duplicating...' : 'Duplicate'}
              </button>
              <button 
                onClick={handleUseTemplate}
                className={`inline-flex items-center gap-2 px-6 py-2 bg-${template.accent}-600 text-white rounded-lg hover:bg-${template.accent}-700 font-medium`}
              >
                <Edit className="h-4 w-4" />
                Use This Template
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template Preview */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Preview</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Full-size preview of the template</p>
            </div>
            
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div id="template-preview" ref={previewRef} className="bg-white transform scale-100 md:scale-90 origin-top-left min-w-[720px]">
                {renderPreview()}
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div className="space-y-6">
            <div className={`bg-gradient-to-br ${template.color} p-6 rounded-xl`}>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Template Features</h3>
              <ul className="space-y-2">
                {template.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <div className={`w-1.5 h-1.5 bg-${template.accent}-500 rounded-full mt-2 flex-shrink-0`}></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleUseTemplate}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-${template.accent}-600 text-white rounded-lg hover:bg-${template.accent}-700 font-medium`}
                >
                  <Edit className="h-4 w-4" />
                  Create Invoice
                </button>
                <button 
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" />
                  {duplicating ? 'Duplicating...' : 'Duplicate Template'}
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {downloading ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Template Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Category:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">Invoice</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Style:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">{template.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Format:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">A4 / Letter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Customizable:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;
