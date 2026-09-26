import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  Type,
  FileUp,
  Sparkles
} from 'lucide-react';
import { LegalDocument } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentLoaded: (doc: LegalDocument) => void;
  onExploreDemoRequested: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentLoaded,
  onExploreDemoRequested,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [docTitle, setDocTitle] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Pipeline Processing States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Analyzing your document…');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    // Basic format check
    const supportedTypes = [
      'application/pdf', 
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/webp'
    ];
    
    if (file.type && !supportedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      setErrorMessage("This file type isn't supported yet. Please upload a PDF, text document, or image.");
      return;
    }

    setSelectedFile(file);
    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    setErrorMessage(null);
  };

  const handleProcessUpload = async () => {
    if (!selectedFile && activeTab === 'upload') {
      setErrorMessage('Please select a document file to upload.');
      return;
    }
    if (!pastedText.trim() && activeTab === 'paste') {
      setErrorMessage('Please paste the agreement or letter text to analyze.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('Analyzing your document…');

    const statusStages = [
      'Analyzing your document…',
      'Reading clauses & finding what matters…',
      'Preparing simple explanations…',
      'Ready to explore'
    ];

    let stageIdx = 0;
    const stageTimer = setInterval(() => {
      stageIdx++;
      if (stageIdx < statusStages.length - 1) {
        setProcessingStatus(statusStages[stageIdx]);
      }
    }, 600);

    try {
      let base64Data: string | undefined = undefined;
      let mimeType = 'application/pdf';

      if (selectedFile) {
        mimeType = selectedFile.type || 'application/pdf';
        const buffer = await selectedFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64Data = btoa(binary);
      }

      const res = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle.trim() || (selectedFile ? selectedFile.name : 'Uploaded Document'),
          textContent: pastedText.trim() || undefined,
          base64Data,
          mimeType,
        }),
      });

      clearInterval(stageTimer);

      if (res.ok) {
        const analyzedDoc = await res.json();
        const finalFindings = Array.isArray(analyzedDoc.findings) ? analyzedDoc.findings : [];
        const finalPages = Array.isArray(analyzedDoc.pages) && analyzedDoc.pages.length > 0 
          ? analyzedDoc.pages 
          : [
              {
                pageNumber: 1,
                title: 'Page 1',
                sections: finalFindings.map((f: any, idx: number) => ({
                  sectionNumber: f.section || `Section ${idx + 1}`,
                  heading: f.title,
                  text: f.evidence || f.summary,
                })),
                rawText: pastedText || 'Uploaded document content reviewed.',
              }
            ];

        const finalDoc: LegalDocument = {
          title: analyzedDoc.title || docTitle.trim() || (selectedFile ? selectedFile.name : 'Uploaded Document'),
          documentType: analyzedDoc.documentType || 'Legal Agreement',
          parties: Array.isArray(analyzedDoc.parties) && analyzedDoc.parties.length > 0 ? analyzedDoc.parties : ['Party 1', 'Party 2'],
          effectiveDate: analyzedDoc.effectiveDate || 'Pending Execution',
          jurisdiction: analyzedDoc.jurisdiction || 'Applicable Jurisdiction',
          pageCount: analyzedDoc.pageCount || finalPages.length,
          ...analyzedDoc,
          id: `user-doc-${Date.now()}`,
          source: 'user',
          isDemo: false,
          uploadedAt: 'Just now',
          fileSize: selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Pasted Text',
          findings: finalFindings,
          pages: finalPages,
          missingOrAmbiguous: Array.isArray(analyzedDoc.missingOrAmbiguous) ? analyzedDoc.missingOrAmbiguous : [],
          crossClauseRelationships: Array.isArray(analyzedDoc.crossClauseRelationships) ? analyzedDoc.crossClauseRelationships : [],
          checklist: Array.isArray(analyzedDoc.checklist) ? analyzedDoc.checklist : [],
          keyTerms: {
            attentionItemsCount: finalFindings.filter((f: any) => f.severity === 'warning' || f.severity === 'attention').length,
            ...(analyzedDoc.keyTerms || {}),
          },
        };

        setProcessingStatus('Ready to explore');
        setTimeout(() => {
          setIsProcessing(false);
          onDocumentLoaded(finalDoc);
          onClose();
        }, 300);
      } else {
        throw new Error('Analysis API failed');
      }
    } catch (err) {
      clearInterval(stageTimer);
      console.error('Upload processing error:', err);
      setIsProcessing(false);
      setErrorMessage("We couldn't analyze this document. Try uploading the file again or paste the text directly.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#DADCE0] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F1F3F4] flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-[#1F1F1F]">
              Upload your document
            </h2>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Upload first. CLAUSETRACE automatically reads and classifies your document.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl hover:bg-[#F1F3F4] text-[#5F6368] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Processing Pipeline Screen */}
        {isProcessing ? (
          <div className="p-10 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-xl text-[#1F1F1F]">
                {processingStatus}
              </h3>
              <p className="text-xs text-[#5F6368] max-w-xs mx-auto leading-relaxed">
                Reading terms, locating numbers, and preparing clear grounded explanations.
              </p>
            </div>

            <div className="pt-2 text-xs text-[#137333] flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Grounded in actual document clauses</span>
            </div>
          </div>
        ) : (
          <>
            {/* Tab switch */}
            <div className="px-6 pt-3 border-b border-[#F1F3F4] flex gap-4 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
                className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#5F6368] hover:text-[#1F1F1F]'
                }`}
              >
                <FileUp className="w-4 h-4" />
                <span>Upload file (PDF, image)</span>
              </button>

              <button
                onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
                className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'paste'
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#5F6368] hover:text-[#1F1F1F]'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Paste text</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-[#FCE8E6] border border-[#FAD2CF] flex items-start gap-2.5 text-xs text-[#D93025]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {activeTab === 'upload' ? (
                <div className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-[#DADCE0] hover:border-[#1A73E8] rounded-2xl bg-[#F8F9FA] hover:bg-[#E8F0FE]/30 transition-all text-center cursor-pointer space-y-3"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.doc,.docx,image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E0E2E6] text-[#1A73E8] flex items-center justify-center mx-auto shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="font-semibold text-sm text-[#1F1F1F]">
                        {selectedFile ? selectedFile.name : 'Click to select or drag file here'}
                      </div>
                      <p className="text-xs text-[#5F6368] mt-1">
                        PDF, scanned contracts, leases, offer letters, or notices
                      </p>
                    </div>

                    {selectedFile && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] text-[#137333] text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{Math.round(selectedFile.size / 1024)} KB ready</span>
                      </div>
                    )}
                  </div>

                  {/* Document Name input */}
                  <div>
                    <label className="block text-xs font-semibold text-[#3C4043] mb-1">
                      Document name (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. My Apartment Lease Agreement"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DADCE0] text-xs text-[#1F1F1F] focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3C4043] mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Employment Offer Letter"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DADCE0] text-xs text-[#1F1F1F] focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3C4043] mb-1">
                      Paste document text
                    </label>
                    <textarea
                      rows={8}
                      placeholder="Paste clauses, letter content, or agreement text here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-[#DADCE0] text-xs font-mono text-[#1F1F1F] focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#F1F3F4] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => {
                  onClose();
                  onExploreDemoRequested();
                }}
                className="text-xs text-[#B06000] hover:text-[#8C4D00] flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try demo documents instead</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#5F6368] hover:bg-[#F1F3F4] transition-colors"
                >
                  Cancel
                </button>

                <button
                  id="modal-submit-analyze-btn"
                  onClick={handleProcessUpload}
                  disabled={isProcessing || (!selectedFile && !pastedText.trim())}
                  className="px-5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-[#DADCE0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Analyze & Understand
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
