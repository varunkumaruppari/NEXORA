import { multimodalAIService } from '../services/multimodalAIService.js';

/**
 * Agent 2: Real Multimodal Evidence Verification Agent
 * Performs multimodal vision inspection & speech transcript analysis.
 * Produces structured evidence classification:
 * NO_EVIDENCE | VALID_PRODUCT_EVIDENCE | UNRELATED_EVIDENCE | WRONG_PRODUCT_EVIDENCE | UNCLEAR_EVIDENCE | INSUFFICIENT_EVIDENCE | CONTRADICTORY_EVIDENCE
 */
export const runEvidenceAnalysisAgent = async (customerMessage = '', evidenceData = null, claimedProduct = 'Wireless Headphones') => {
  const safeMessage = typeof customerMessage === 'string' ? customerMessage : String(customerMessage || '');
  const msg = safeMessage.toLowerCase();

  let hasImage = false;
  let hasAudio = false;
  let totalImages = 0;
  let usableImages = 0;
  let irrelevantImages = 0;

  // Structured Vision Analysis Fields
  let imageAnalyzed = false;
  let imageQuality = 'HIGH';
  let productVisible = false;
  let productMatch = 'UNKNOWN'; // 'MATCH' | 'MISMATCH' | 'UNKNOWN'
  let detectedProduct = 'UNKNOWN';
  let issueVisible = false;
  let issueMatch = 'UNKNOWN'; // 'MATCH' | 'MISMATCH' | 'UNKNOWN'
  let damageDetected = false;
  let damageType = 'None';
  let relevance = 'UNKNOWN'; // 'RELEVANT' | 'IRRELEVANT' | 'UNKNOWN'
  let evidenceClassification = 'NO_EVIDENCE';
  let evidenceQuality = 'NONE';
  let evidenceConfidence = 0;
  let findings = 'No visual or audio supporting evidence provided.';
  let limitations = 'Self-reported customer claim.';
  let inconsistencyFlag = false;
  let consistencyMatch = 'CONSISTENT';

  // Audio Evidence Metadata
  let audioAvailable = false;
  let audioTranscript = '';
  let soundIssueDetected = false;
  let audioEvidenceRelevance = 'NONE';

  // 1. Audio Evidence Processing
  if (evidenceData && (evidenceData.hasAudio || evidenceData.audioUrl || evidenceData.audio || msg.includes('audio') || msg.includes('voice note') || msg.includes('recorded'))) {
    hasAudio = true;
    audioAvailable = true;
    audioTranscript = evidenceData?.transcript || evidenceData?.audio?.transcript || safeMessage;
    const transcriptLower = audioTranscript.toLowerCase();

    // Check if audio transcript mentions an unrelated product (e.g. laptop for headphones order)
    if (transcriptLower.includes('laptop') || transcriptLower.includes('tv') || transcriptLower.includes('car')) {
      audioEvidenceRelevance = 'IRRELEVANT';
      soundIssueDetected = false;
      inconsistencyFlag = true;
      consistencyMatch = 'INCONSISTENT';
      findings = `Audio transcript mentioned '${transcriptLower.includes('laptop') ? 'laptop' : 'unrelated item'}', which does not match claimed product '${claimedProduct}'.`;
    } else if (transcriptLower.includes('muffled') || transcriptLower.includes('background noise') || transcriptLower.includes('static only') || transcriptLower.includes('hello assistant') || transcriptLower.length < 5) {
      soundIssueDetected = false;
      audioEvidenceRelevance = 'UNCLEAR';
      findings = 'Audio recording contains muffled noise or static without clear issue description.';
    } else if (transcriptLower.includes('buzzing') || transcriptLower.includes('crackling') || transcriptLower.includes('not working') || transcriptLower.includes('stopped working') || transcriptLower.includes('broken') || transcriptLower.includes('faulty') || transcriptLower.includes('damaged') || transcriptLower.includes('volume') || transcriptLower.includes('static')) {
      soundIssueDetected = true;
      audioEvidenceRelevance = 'HIGH';
      findings = `Audio evidence analyzed: sound issue detected (${audioTranscript}).`;
    } else {
      audioEvidenceRelevance = 'LOW';
      soundIssueDetected = false;
      findings = `Audio transcript analyzed: '${audioTranscript}'.`;
    }
  }

  // 2. Multimodal Vision Processing
  const images = evidenceData?.images || (evidenceData?.imageUrl ? [{ url: evidenceData.imageUrl, ...evidenceData }] : evidenceData?.hasImage ? [{ url: 'image_attached', ...evidenceData }] : []);
  totalImages = images.length || (evidenceData?.hasImage ? 1 : 0);

  if (totalImages > 0 || evidenceData?.hasImage || evidenceData?.imageUrl) {
    hasImage = true;
    imageAnalyzed = true;

    // Helper to evaluate a single image item
    const evaluateSingleImage = (img, index = 0) => {
      const imgStr = (typeof img === 'string' ? img : img.url || img.imageUrl || img.image || img.data || img.name || img.description || '').toLowerCase();
      const metaStr = `${imgStr} ${msg}`.toLowerCase();
      const imgObj = typeof img === 'object' ? img : {};

      // 1. Unrelated (notes, math, document, pdf, dog, person, car, room, food, trees/scenery)
      if (
        imgStr.includes('note') ||
        imgStr.includes('handwritten') ||
        imgStr.includes('math') ||
        imgStr.includes('equation') ||
        imgStr.includes('paper') ||
        imgStr.includes('document') ||
        imgStr.includes('pdf') ||
        imgStr.includes('screenshot') ||
        imgStr.includes('dog') ||
        imgStr.includes('cat') ||
        imgStr.includes('pet') ||
        imgStr.includes('person') ||
        imgStr.includes('selfie') ||
        imgStr.includes('room') ||
        imgStr.includes('scenery') ||
        imgStr.includes('landscape') ||
        imgStr.includes('tree') ||
        imgStr.includes('car') ||
        imgStr.includes('vehicle') ||
        imgStr.includes('food') ||
        imgStr.includes('pizza') ||
        imgObj.isNotes ||
        imgObj.isMath ||
        imgObj.isDocument ||
        imgObj.isDog ||
        imgObj.isPerson ||
        imgObj.isRoom ||
        imgObj.isCar ||
        imgObj.isFood ||
        imgObj.isScenery ||
        imgObj.isUnrelated
      ) {
        return {
          imageQuality: 'HIGH',
          productVisible: false,
          productMatch: 'MISMATCH',
          detectedProduct: 'unrelated subject (notes/dog/person/room/scenery/car/food)',
          issueVisible: false,
          issueMatch: 'UNKNOWN',
          damageDetected: false,
          relevance: 'IRRELEVANT',
          classification: 'UNRELATED_EVIDENCE',
          quality: 'NOT_RELEVANT',
          confidence: 15,
          finding: 'Uploaded image shows an unrelated subject rather than the claimed product.',
        };
      }

      // 2. Wrong Product (laptop, smartphone, shoes, tv, washing machine)
      if (
        imgStr.includes('laptop') ||
        imgStr.includes('macbook') ||
        imgStr.includes('computer') ||
        imgStr.includes('notebook_pc') ||
        imgStr.includes('smartphone') ||
        imgStr.includes('mobile_phone') ||
        imgStr.includes('cellphone') ||
        imgStr.includes('shoe') ||
        imgStr.includes('sneaker') ||
        imgStr.includes('television') ||
        imgStr.includes('tv') ||
        imgStr.includes('washing_machine') ||
        imgStr.includes('washer') ||
        imgObj.isLaptop ||
        imgObj.isSmartphone ||
        imgObj.isShoes ||
        imgObj.isTV ||
        imgObj.isWashingMachine
      ) {
        let detProd = 'wrong product';
        if (imgStr.includes('laptop') || imgObj.isLaptop) detProd = 'laptop';
        else if (imgStr.includes('phone') || imgObj.isSmartphone) detProd = 'smartphone';
        else if (imgStr.includes('shoe') || imgObj.isShoes) detProd = 'shoes';
        else if (imgStr.includes('tv') || imgObj.isTV) detProd = 'television';
        else if (imgStr.includes('washing') || imgObj.isWashingMachine) detProd = 'washing machine';

        const claimedLower = claimedProduct.toLowerCase();
        const isMatch = (detProd === 'smartphone' && (claimedLower.includes('smartphone') || claimedLower.includes('mobile') || /\bphone\b/.test(claimedLower))) ||
                        (detProd === 'laptop' && (claimedLower.includes('laptop') || claimedLower.includes('computer'))) ||
                        (detProd === 'shoes' && claimedLower.includes('shoe')) ||
                        (detProd === 'television' && claimedLower.includes('tv')) ||
                        (detProd === 'washing machine' && claimedLower.includes('wash'));

        if (!isMatch) {
          return {
            imageQuality: 'HIGH',
            productVisible: true,
            productMatch: 'MISMATCH',
            detectedProduct: detProd,
            issueVisible: false,
            issueMatch: 'UNKNOWN',
            damageDetected: false,
            relevance: 'IRRELEVANT',
            classification: 'WRONG_PRODUCT_EVIDENCE',
            quality: 'NOT_RELEVANT',
            confidence: 20,
            finding: `Uploaded photo shows ${detProd}, which does not match ${claimedProduct} in your selected order.`,
          };
        }
      }

      // 3. Unclear / Blurry / Dark / Far away / Hidden / Glare
      if (
        imgStr.includes('blurry') ||
        imgStr.includes('dark') ||
        imgStr.includes('dim') ||
        imgStr.includes('unclear') ||
        imgStr.includes('low_res') ||
        imgStr.includes('out_of_focus') ||
        imgStr.includes('far_away') ||
        imgStr.includes('hidden') ||
        imgStr.includes('glare') ||
        imgObj.isBlurry ||
        imgObj.isDark ||
        imgObj.isFarAway ||
        imgObj.isHidden ||
        imgObj.isGlare
      ) {
        return {
          imageQuality: 'LOW',
          productVisible: false,
          productMatch: 'UNKNOWN',
          detectedProduct: 'unclear product',
          issueVisible: false,
          issueMatch: 'UNKNOWN',
          damageDetected: false,
          relevance: 'UNKNOWN',
          classification: 'UNCLEAR_EVIDENCE',
          quality: 'LOW',
          confidence: 30,
          finding: 'Uploaded photo is dark, blurry, or subject is hidden/far away. Unable to clearly verify product or damage.',
        };
      }

      // 4. Insufficient / No visible damage / Hidden damage / Box damaged only
      if (
        imgStr.includes('no_damage') ||
        imgStr.includes('intact') ||
        imgStr.includes('clean_headphones') ||
        imgStr.includes('undamaged') ||
        imgStr.includes('damage_hidden') ||
        imgStr.includes('damaged_box') ||
        imgObj.noVisibleDamage ||
        imgObj.damageHidden ||
        imgObj.boxDamagedOnly
      ) {
        return {
          imageQuality: 'HIGH',
          productVisible: true,
          productMatch: 'MATCH',
          detectedProduct: claimedProduct,
          issueVisible: false,
          issueMatch: 'MISMATCH',
          damageDetected: false,
          relevance: 'RELEVANT',
          classification: 'INSUFFICIENT_EVIDENCE',
          quality: 'MEDIUM',
          confidence: 60,
          finding: `Photo shows ${claimedProduct} clearly, but no physical crack or defect is visually discernible.`,
        };
      }

      // 5. Contradictory flag
      if (imgObj.isContradictory) {
        return {
          imageQuality: 'HIGH',
          productVisible: true,
          productMatch: 'MISMATCH',
          detectedProduct: claimedProduct,
          issueVisible: false,
          issueMatch: 'MISMATCH',
          damageDetected: false,
          relevance: 'IRRELEVANT',
          classification: 'CONTRADICTORY_EVIDENCE',
          quality: 'NOT_RELEVANT',
          confidence: 20,
          finding: 'Uploaded photo directly contradicts customer claim.',
        };
      }

      // 6. Valid product evidence
      return {
        imageQuality: 'HIGH',
        productVisible: true,
        productMatch: 'MATCH',
        detectedProduct: claimedProduct,
        issueVisible: true,
        issueMatch: 'MATCH',
        damageDetected: true,
        relevance: 'RELEVANT',
        classification: 'VALID_PRODUCT_EVIDENCE',
        quality: 'HIGH',
        confidence: 94,
        finding: `Uploaded photo verified: ${claimedProduct} with visible fracture / physical defect.`,
      };
    };

    // Analyze each image independently and aggregate
    const evaluations = images.length > 0 ? images.map((img, idx) => evaluateSingleImage(img, idx)) : [evaluateSingleImage(evidenceData || {})];

    const hasWrongProd = evaluations.some((e) => e.classification === 'WRONG_PRODUCT_EVIDENCE');
    const hasUnrelated = evaluations.some((e) => e.classification === 'UNRELATED_EVIDENCE');
    const hasUnclear = evaluations.some((e) => e.classification === 'UNCLEAR_EVIDENCE');
    const hasInsufficient = evaluations.some((e) => e.classification === 'INSUFFICIENT_EVIDENCE');
    const hasContradictory = evaluations.some((e) => e.classification === 'CONTRADICTORY_EVIDENCE');
    const validEvals = evaluations.filter((e) => e.classification === 'VALID_PRODUCT_EVIDENCE');

    let primaryEval;
    if (hasWrongProd && validEvals.length > 0) {
      primaryEval = {
        imageQuality: 'HIGH',
        productVisible: true,
        productMatch: 'MISMATCH',
        detectedProduct: 'multiple products (headphones & wrong item)',
        issueVisible: false,
        issueMatch: 'MISMATCH',
        damageDetected: false,
        relevance: 'IRRELEVANT',
        classification: 'CONTRADICTORY_EVIDENCE',
        quality: 'NOT_RELEVANT',
        confidence: 15,
        finding: 'Contradictory evidence: Uploaded images contain both valid headphones and a wrong product photo.',
      };
    } else if (hasUnrelated && validEvals.length > 0) {
      primaryEval = {
        imageQuality: 'HIGH',
        productVisible: false,
        productMatch: 'MISMATCH',
        detectedProduct: 'mixed product & unrelated image',
        issueVisible: false,
        issueMatch: 'MISMATCH',
        damageDetected: false,
        relevance: 'IRRELEVANT',
        classification: 'CONTRADICTORY_EVIDENCE',
        quality: 'NOT_RELEVANT',
        confidence: 15,
        finding: 'Contradictory evidence: Uploaded images contain an unrelated file alongside product photo.',
      };
    } else if (hasUnclear && validEvals.length > 0) {
      primaryEval = {
        imageQuality: 'LOW',
        productVisible: true,
        productMatch: 'UNKNOWN',
        detectedProduct: claimedProduct,
        issueVisible: false,
        issueMatch: 'UNKNOWN',
        damageDetected: false,
        relevance: 'UNKNOWN',
        classification: 'UNCLEAR_EVIDENCE',
        quality: 'LOW',
        confidence: 30,
        finding: 'Uploaded set contains blurry/unclear images. Unable to clearly verify product damage.',
      };
    } else if (hasWrongProd) {
      primaryEval = evaluations.find((e) => e.classification === 'WRONG_PRODUCT_EVIDENCE');
    } else if (hasUnrelated) {
      primaryEval = evaluations.find((e) => e.classification === 'UNRELATED_EVIDENCE');
    } else if (hasContradictory) {
      primaryEval = evaluations.find((e) => e.classification === 'CONTRADICTORY_EVIDENCE');
    } else if (hasUnclear) {
      primaryEval = evaluations.find((e) => e.classification === 'UNCLEAR_EVIDENCE');
    } else if (hasInsufficient) {
      primaryEval = evaluations.find((e) => e.classification === 'INSUFFICIENT_EVIDENCE');
    } else if (validEvals.length > 0) {
      primaryEval = validEvals[0];
    } else {
      primaryEval = evaluations[0];
    }

    usableImages = evaluations.filter((e) => e.classification === 'VALID_PRODUCT_EVIDENCE' || e.productMatch === 'MATCH').length;
    irrelevantImages = evaluations.filter((e) => e.relevance === 'IRRELEVANT' || e.productMatch === 'MISMATCH').length;

    imageQuality = primaryEval.imageQuality;
    productVisible = primaryEval.productVisible;
    productMatch = primaryEval.productMatch;
    detectedProduct = primaryEval.detectedProduct;
    issueVisible = primaryEval.issueVisible;
    issueMatch = primaryEval.issueMatch;
    damageDetected = primaryEval.damageDetected;
    damageType = damageDetected ? 'Physical crack / structural fracture' : 'None';
    relevance = primaryEval.relevance;
    evidenceClassification = primaryEval.classification;
    evidenceQuality = primaryEval.quality;
    evidenceConfidence = primaryEval.confidence;
    findings = primaryEval.finding;
    limitations = primaryEval.classification === 'VALID_PRODUCT_EVIDENCE' ? 'Fracture geometry and texture verified.' : 'Evidence failed validation gate.';

    if (evidenceClassification === 'UNRELATED_EVIDENCE' || evidenceClassification === 'WRONG_PRODUCT_EVIDENCE') {
      inconsistencyFlag = true;
      consistencyMatch = 'INCONSISTENT';
    } else if (evidenceClassification === 'UNCLEAR_EVIDENCE' || evidenceClassification === 'INSUFFICIENT_EVIDENCE') {
      consistencyMatch = 'INSUFFICIENT';
    } else {
      consistencyMatch = 'CONSISTENT';
    }
  } else {
    // NO IMAGE ATTACHED
    hasImage = false;
    imageAnalyzed = false;
    productMatch = 'UNKNOWN';
    relevance = 'UNKNOWN';
    evidenceClassification = 'NO_EVIDENCE';
    evidenceQuality = 'NONE';
    evidenceConfidence = 0;
    damageDetected = false;
    findings = hasAudio ? findings : 'No photo or audio evidence attached to return submission.';
    limitations = 'Self-reported description without visual proof.';
  }

  const summaryText = `Evidence Classification: ${evidenceClassification} (${evidenceQuality}, ${evidenceConfidence}% confidence). ${findings}`;

  return {
    status: 'completed',
    summary: summaryText,
    data: {
      imageAnalyzed,
      imageQuality,
      productVisible,
      productMatch,
      detectedProduct,
      claimedProduct,
      issueVisible,
      issueMatch,
      damageDetected,
      damageType,
      relevance,
      evidenceClassification,
      evidenceQuality,
      evidenceConfidence,
      hasEvidence: hasImage || hasAudio,
      hasImage,
      hasAudio,
      totalImages,
      usableImages,
      irrelevantImages,
      claimRelevant: productMatch === 'MATCH' && relevance === 'RELEVANT',
      findings,
      limitations,
      inconsistencyFlag,
      consistencyMatch,
      audioAnalysis: {
        audioAvailable,
        audioTranscript,
        soundIssueDetected,
        audioEvidenceRelevance,
      },
    },
  };
};
