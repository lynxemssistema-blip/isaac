import { Router } from 'express';
import {
  getPublicCampaignBySlug,
  getPublicDefaultCampaign,
  completeSignupAndDeliverPdf,
  sendPdfToExistingUser,
  getAdminPdfCampaigns,
  getAdminPdfDeliveries,
  createAdminPdfCampaign,
  updateAdminPdfCampaign,
  deleteAdminPdfCampaign,
  testOrResendCampaignPdf,
} from '../controllers/pdfCampaignController.js';

const router = Router();

// Rotas Públicas (Página de Cadastro Direto & Modal da Landing Page)
router.get('/campaigns/public-default', getPublicDefaultCampaign);
router.get('/campaigns/public/:slug', getPublicCampaignBySlug);
router.post('/campaigns/complete-signup', completeSignupAndDeliverPdf);
router.post('/campaigns/send-existing', sendPdfToExistingUser);

// Rotas Administrativas (Painel Admin)
router.get('/admin/pdf-campaigns', getAdminPdfCampaigns);
router.post('/admin/pdf-campaigns', createAdminPdfCampaign);
router.put('/admin/pdf-campaigns/:id', updateAdminPdfCampaign);
router.delete('/admin/pdf-campaigns/:id', deleteAdminPdfCampaign);
router.post('/admin/pdf-campaigns/:id/send', testOrResendCampaignPdf);
router.get('/admin/pdf-deliveries', getAdminPdfDeliveries);

export default router;

