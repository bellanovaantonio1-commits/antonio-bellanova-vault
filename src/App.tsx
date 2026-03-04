import React, { useState, useEffect, useRef } from 'react';
import { 
  Diamond, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  Gavel, 
  ShoppingBag, 
  Users, 
  Plus, 
  LogOut, 
  CheckCircle, 
  Clock, 
  Upload,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  MapPin,
  Mail,
  Lock,
  Signature,
  Globe,
  TrendingUp,
  History,
  Award,
  Download,
  Eye,
  AlertCircle,
  Check,
  Bell,
  FileDown,
  ExternalLink,
  Send,
  BarChart3,
  MessageCircle,
  Heart,
  PieChart,
  Wrench,
  Sun,
  Moon,
  Search,
  Package,
  BookOpen,
  LineChart,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from "jspdf";
import { User, UserRole, UserStatus, Masterpiece, Auction, Payment, Contract, Certificate, Bid, Notification, PurchaseWorkflow, EscrowTransaction, InvestorAnalytics, InvestorRequest, ChatThread, ChatMessage, ConciergeAvailability, Appointment } from './types';

// --- Constants ---
const COMPANY_INFO = {
  name: "Juwelen & Schmuckatelier Antonio Bellanova",
  owner: "Antonio Bellanova",
  address: "Ahorstraße 8, 50765 Köln, Deutschland",
  iban: "DE12 3456 7890 1234 5678 90",
  vatId: "DE457682154",
  steuernummer: "223/5019/5355"
};

const LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' }
];

const TRANSLATIONS: any = {
  de: {
    dashboard: "Dashboard",
    marketplace: "Marktplatz",
    auctions: "Auktionen",
    vault: "Der Tresor",
    management: "Verwaltung",
    welcome: "Willkommen im Atelier",
    my_assets: "Meine Schätze",
    certificates: "Zertifikate",
    active_bids: "Aktive Gebote",
    membership: "Mitgliedschaftsstatus",
    featured: "Ausgewählte Meisterwerke",
    request_acquisition: "Erwerb anfragen",
    reserved: "Reserviert",
    sold: "Verkauft",
    resale_pending: "Wiederverkauf ausstehend",
    resale_review: "In Prüfung",
    sign_out: "Abmelden",
    my_pieces: "Meine Stücke",
    contracts: "Verträge",
    payments: "Zahlungen",
    my_bids: "Meine Gebote",
    resale: "Wiederverkauf",
    vip: "VIP",
    view: "Ansehen",
    sign_digitally: "Digital unterzeichnen",
    accept_contract: "Vertrag annehmen",
    signed_on: "Unterzeichnet am",
    list_resale: "Zum Wiederverkauf anbieten",
    resale_pending_approval: "Wiederverkauf wartet auf Genehmigung",
    deposit: "Anzahlung",
    full_payment: "Vollständige Zahlung",
    issued: "Ausgestellt",
    cert_details: "Details zum Zertifikat",
    blockchain_hash: "Blockchain-Hash",
    digital_signature: "Digitale Signatur",
    scan_verify: "Scannen zur Echtheitsprüfung auf der Blockchain",
    download_pdf: "Offizielles PDF herunterladen",
    view_details: "Details ansehen",
    materials: "Materialien",
    gemstones: "Edelsteine",
    rarity: "Seltenheit",
    description: "Beschreibung",
    close: "Schließen",
    legal_notice: "Durch Fortfahren müssen Sie die vertraglichen Dokumente zu diesem Stück prüfen und unterzeichnen.",
    sign_contract: "Vertrag unterzeichnen",
    typed_signature: "Getippte Unterschrift",
    draw_signature: "Gezeichnete Unterschrift",
    email_verification: "E-Mail-Verifizierung",
    confirm_review: "Ich habe alle Dokumente gelesen und verstanden.",
    signature_required: "Unterschrift erforderlich",
    clear: "Löschen",
    verify: "Verifizieren",
    ownership_pending: "Eigentumsübertragung ausstehend",
    ownership_transferred: "Eigentum übertragen",
    payment_unlocked: "Zahlung freigeschaltet",
    waiting_signature: "Wartet auf Unterschrift",
    payment_available: "Zahlung verfügbar",
    piece_reserved: "Stück reserviert",
    payment_pending: "Zahlung ausstehend",
    completed: "Abgeschlossen",
    signed: "Unterzeichnet",
    login: "Anmelden",
    register: "Registrieren",
    email: "E-Mail",
    password: "Passwort",
    name: "Name",
    address: "Adresse",
    language: "Sprache",
    role: "Rolle",
    cancel: "Abbrechen",
    save: "Speichern",
    submit: "Absenden",
    "roles.client": "Kunde",
    "roles.investor": "Investor",
    "roles.vip": "VIP",
    "roles.corporate": "Unternehmen",
    "roles.reseller": "Wiederverkäufer",
    "roles.atelier_partner": "Atelier-Partner",
    "roles.viewer": "Betrachter (nur Lese)",
    "roles.advisor": "Strategic Private Advisor (nur per Einladung)",
    "auth.full_legal_name": "Vollständiger Name",
    "auth.name_placeholder_id": "Name wie im Ausweis",
    "auth.your_signature": "Ihre Unterschrift",
    "auth.verification_code_sent": "Ein Bestätigungscode wird an Ihre E-Mail gesendet.",
    "auth.sending": "Wird gesendet…",
    "auth.verified": "Verifiziert",
    "auth.send_verification_code": "Bestätigungscode senden",
    "auth.full_name": "Vollständiger Name",
    "auth.name_placeholder": "Antonio Bellanova",
    "auth.address_placeholder": "Ahorstraße 8, 50765 Köln",
    "auth.access_role": "Zugangsrolle",
    "auth.email_placeholder": "name@vault.com",
    "auth.email_or_username": "E-Mail oder Anmeldename",
    "auth.username": "Anmeldename",
    "auth.username_placeholder": "z. B. max_mustermann",
    "auth.password_placeholder": "••••••••",
    "auth.apply_vip": "VIP-Mitgliedschaft beantragen",
    "auth.processing": "Wird verarbeitet…",
    "auth.sign_in": "Anmelden",
    "auth.create_account": "Konto erstellen",
    "auth.register_success": "Registrierung erfolgreich. Bitte warten Sie auf die Freigabe.",
    "clear_signature": "Unterschrift löschen",
    "cert.generated": "Echtheitszertifikat wurde erstellt und im Tresor gespeichert.",
    "cert.title": "Echtheitszertifikat",
    "investor.title": "Investor",
    "investor.insights": "Einblicke",
    "investor.dataroom": "Data Room",
    "investor.total_value_shares": "Gesamtwert Anteile",
    "investor.my_shares": "Meine Anteile",
    "investor.market_performance": "Marktperformance",
    "investor.request_access": "Zugang anfordern",
    "investor.request_allocation": "Zuteilung anfragen",
    "investor.request_allocation_desc": "Prioritätszugang zu kommenden Drops.",
    "investor.schedule_meeting": "Termin vereinbaren",
    "investor.schedule_meeting_desc": "Direkte Beratung mit Antonio Bellanova.",
    "investor.vip_preview": "VIP-Vorschau",
    "investor.vip_preview_desc": "Frühzugang zu physischen Ausstellungen.",
    "investor.request_share": "Anteil kaufen",
    "investor.request_share_desc": "In Anteile eines physischen Meisterstücks investieren.",
    "investor.fractional_offers": "Verfügbare Anteile",
    "investor.request_share_pct": "Anteil anfragen (%)",
    "investor.no_fractional_offers": "Derzeit keine Anteile zum Verkauf.",
    "investor.request_submitted": "Anfrage gesendet. Unser Team meldet sich in Kürze.",
    "admin.piece_created": "Meisterwerk erfolgreich erstellt.",
    "admin.auction_created": "Auktion erfolgreich erstellt.",
    "admin.piece_assigned": "Stück erfolgreich zugewiesen.",
    "admin.client_added": "Kunde angelegt. Zugangstoken erstellt.",
    "admin.add_client": "Neuen Kunden hinzufügen",
    "admin.vip_status": "VIP-Status",
    "admin.create_client_btn": "Kunde anlegen & Tresor erstellen",
    "admin.create_auction": "Auktion erstellen",
    "admin.select_masterpiece": "Meisterstück auswählen",
    "admin.choose_piece": "Stück wählen…",
    "admin.start_price": "Startpreis (€)",
    "admin.end_time": "Endzeitpunkt",
    "admin.auction_terms": "Auktionsbedingungen (Terms)",
    "admin.terms_placeholder": "Standard-Luxus-Auktionsbedingungen…",
    "admin.vip_only": "Nur VIP-Frühzugang",
    "admin.start_auction": "Auktion starten",
    "admin.assign_piece": "Stück manuell zuweisen",
    "admin.select_user": "Nutzer auswählen",
    "admin.choose_user": "Nutzer wählen…",
    "admin.assign_ownership": "Besitz zuweisen",
    "admin.pending_purchases": "Ausstehende Käufe",
    "admin.approve": "Genehmigen",
    "admin.reject": "Ablehnen",
    "admin.deposit_contract": "Anzahlungsvertrag",
    "admin.deposit_draft": "Entwurf",
    "admin.deposit_signed": "Unterzeichnet",
    "admin.no_pending_purchases": "Keine ausstehenden Käufe.",
    "admin.active_workflows": "Aktive Workflows",
    "admin.resale_requests": "Wiederverkaufsanfragen",
    "admin.resale_price": "Wiederverkaufspreis",
    "admin.no_resale_requests": "Keine ausstehenden Wiederverkaufsanfragen.",
    "admin.commission": "Provision",
    "admin.commission_pct": "Provision (%)",
    "admin.min_price": "Mindestpreis",
    "admin.adjust_commission": "Provision anpassen",
    "admin.prioritize_auction": "Auktion priorisieren",
    "admin.decision_curated": "Kuratierter Marktplatz",
    "admin.decision_auction": "Private Auktion",
    "admin.decision_offer": "Privates Angebot",
    "admin.decision_buyback": "Maison Rückkauf",
    "admin.send_buyback_offer": "Rückkaufangebot senden",
    "admin.price_recommendation": "Preisempfehlung",
    "admin.market_stability": "Marktstabilität",
    "admin.pending_payments": "Ausstehende Zahlungen",
    "admin.confirm_payment": "Zahlung bestätigen",
    "admin.user_approvals": "Nutzer-Genehmigungen",
    "admin.wants_vip": "Wünscht VIP",
    "admin.no_pending_users": "Keine ausstehenden Registrierungen.",
    "admin.investor_requests": "Investor-Anfragen",
    "admin.request_type": "Anfrage",
    "admin.investor_label": "Investor",
    "admin.no_investor_requests": "Keine Investor-Anfragen.",
    "admin.approve_request": "Genehmigen",
    "admin.reject_request": "Ablehnen",
    "admin.fractional_offers": "Anteils-Angebote",
    "admin.set_fractional_offer": "Anteile anbieten",
    "admin.available_pct": "Verfügbar (%)",
    "admin.price_per_pct": "Preis pro % (€)",
    "admin.request_approved_msg": "Anfrage genehmigt. Zugang gewährt.",
    "admin.request_rejected_msg": "Anfrage abgelehnt.",
    "admin.signed_contracts": "Unterzeichnete Verträge",
    "admin.deposit_contract_type": "Anzahlungsvertrag",
    "admin.purchase_contract_type": "Kaufvertrag",
    "admin.customer": "Kunde",
    "admin.piece_label": "Stück",
    "admin.signed_at": "Unterzeichnet am",
    "admin.no_signed_contracts": "Noch keine unterzeichneten Verträge.",
    "admin.tab_overview": "Übersicht",
    "admin.tab_inventory": "Inventar",
    "admin.tab_users": "Nutzer",
    "admin.tab_resale": "Wiederverkauf",
    "admin.tab_appointments": "Termine",
    "admin.tab_intelligence": "Intelligence",
    "admin.tab_legacy": "Legacy / Begünstigte",
    "admin.tab_settings": "Einstellungen",
    "admin.stat_revenue": "Gesamtumsatz",
    "admin.stat_active_users": "Aktive Nutzer",
    "admin.stat_pending_approvals": "Ausstehende Genehmigungen",
    "admin.stat_masterpieces": "Meisterstücke",
    "admin.stat_views": "Aufrufe gesamt",
    "admin.stat_contact_requests": "Kontaktanfragen",
    "admin.stat_last_30_days": "davon letzte 30 Tage",
    "admin.popular_pieces_title": "Beliebte Stücke (Aufrufe + Favoriten)",
    "admin.export_inventory_csv": "Inventar CSV",
    "admin.appointments": "Termine",
    "admin.schedule_appointment": "Termin eintragen",
    "admin.appointment_date": "Datum",
    "admin.appointment_time": "Uhrzeit",
    "admin.appointment_title": "Titel",
    "admin.appointment_notes": "Notizen",
    "admin.new_appointment": "Neuer Termin",
    "admin.no_appointments": "Keine Termine.",
    "admin.open_tasks": "Offene Aufgaben",
    "admin.resale_no_decision": "Resale ohne Entscheidung",
    "admin.appointments_proposed": "Termine vorgeschlagen",
    "admin.atelier_moments": "Atelier-Momente",
    "admin.atelier_moments_desc": "Editoriale Momente für das Dashboard. Reihenfolge: oben = zuerst angezeigt.",
    "admin.field_title": "Titel",
    "admin.field_subtitle": "Untertitel",
    "admin.field_image_url": "Bild-URL",
    "admin.field_body_optional": "Body (optional)",
    "admin.add_button": "Hinzufügen",
    "admin.save_button": "Speichern",
    "admin.save_saving": "Speichern…",
    "admin.remove": "Entfernen",
    "admin.create_masterpiece": "Meisterstück erstellen",
    "admin.edit_piece": "Stück bearbeiten",
    "admin.advisors": "Berater",
    "admin.invite_advisor": "Einladen",
    "admin.generate_password": "Passwort erzeugen",
    "admin.password_for_advisor": "Passwort (selbst wählen oder erzeugen)",
    "admin.password_for_advisor_hint": "Leer: System erzeugt eines. Sonst eingeben oder per Button erzeugen – dann mündlich weitergeben.",
    "admin.password_generated": "Passwort erzeugt. Sie können es mündlich weitergeben.",
    "admin.activate_advisor": "Aktivieren",
    "admin.commission_override": "Provisionssatz",
    "admin.export_commissions": "Provisionen exportieren",
    "admin.manage_commissions": "Provisionen verwalten",
    "admin.advisor_commissions": "Provisionen verwalten",
    "admin.no_commissions": "Keine Provisionen.",
    "admin.no_pending_commissions": "Keine ausstehenden Provisionen.",
    "admin.commission_marked_paid": "Als ausgezahlt markiert.",
    "admin.mark_paid": "Ausgezahlt",
    "admin.no_advisors": "Keine Berater.",
    "advisor.title": "Berater",
    "advisor.overview": "Übersicht",
    "advisor.dashboard": "Dashboard",
    "advisor.clients": "Kunden",
    "advisor.commissions": "Provisionen",
    "advisor.contracts": "Verträge",
    "advisor.referred_clients": "Vermittelte Kunden",
    "advisor.active_deals": "Aktive Deals",
    "advisor.closed_deals": "Abgeschlossene Deals",
    "advisor.pending_commission": "Ausstehende Provision",
    "advisor.paid_commission": "Ausgezahlte Provision",
    "advisor.welcome_message": "Ihre Übersicht: verwaltete Kunden, Deals und Provisionen.",
    "advisor.jurisdiction": "Gerichtsstand: Deutschland, sofern nicht anders vereinbart.",
    "advisor.my_clients": "Meine Kunden",
    "advisor.add_client_email": "E-Mail des Kunden",
    "advisor.link_client": "Kunden verknüpfen",
    "advisor.client_linked": "Kunde verknüpft.",
    "advisor.no_clients": "Noch keine Kunden.",
    "advisor.piece": "Stück",
    "advisor.advisor_name": "Berater",
    "advisor.client_name": "Kunde",
    "advisor.sale_amount": "Verkaufssumme",
    "advisor.commission_pct": "Prozentsatz",
    "advisor.commission_amount": "Provision",
    "advisor.status": "Status",
    "advisor.no_commissions": "Noch keine Provisionen.",
    "advisor.unsigned": "Nicht unterzeichnet",
    "advisor.contracts_download_hint": "Verträge herunterladen, prüfen und anschließend unterzeichnen.",
    "advisor.download_contract": "Herunterladen",
    "advisor.download_error": "Download fehlgeschlagen.",
    "advisor.advisor_agreement": "Rahmenvereinbarung",
    "advisor.commission_agreement": "Provisionsvereinbarung",
    "advisor.not_activated_title": "Zugang noch nicht freigeschaltet",
    "advisor.not_activated_message": "Bitte unterzeichnen Sie zuerst den NDA unter Verträge und warten Sie auf die Freischaltung durch den Administrator.",
    "view.advisor": "Berater",
    "appointments.proposed": "Vorgeschlagen",
    "appointments.confirmed": "Bestätigt",
    "appointments.cancelled": "Abgesagt",
    "appointments.my_appointments": "Deine Termine",
    "appointments.accept": "Annehmen",
    "appointments.decline": "Absagen",
    "appointments.no_appointments_user": "Keine Termine.",
    "marketplace.request_sent": "Kaufanfrage gesendet. Warten auf Admin-Genehmigung.",
    "marketplace.no_pieces": "Derzeit keine Meisterwerke im Marktplatz verfügbar.",
    "marketplace.subtitle": "Exquisite Stücke für den sofortigen Erwerb.",
    "auctions.private_auctions": "Private Auktionen",
    "auctions.subtitle": "Live-Gebote für seltene und einzigartige Meisterwerke.",
    "auctions.no_active": "Derzeit keine aktiven Auktionen.",
    "vault.no_pieces": "Sie besitzen noch keine Stücke.",
    "vault.no_certs": "Noch keine Zertifikate ausgestellt.",
    "vault.reminder_unsigned": "warten auf Ihre Unterschrift.",
    "vault.portfolio_pdf": "Portfolio (PDF)",
    "vault.portfolio_csv": "Portfolio CSV",
    "vault.export_my_data_gdpr": "Meine Daten exportieren (DSGVO)",
    "vault.portfolio_overview": "Portfolio-Übersicht",
    "vault.total_value": "Gesamtwert",
    "vault.legacy": "Legacy",
    "vault.legacy_title": "Legacy & Begünstigte",
    "vault.legacy_subtitle": "Begünstigten anlegen und Nachfolge-Dokumentation hinterlegen. Die Freischaltung erfolgt nach Prüfung durch das Atelier.",
    "vault.legacy_beneficiary_name": "Name des Begünstigten",
    "vault.legacy_beneficiary_contact": "Kontakt (E-Mail oder Telefon)",
    "vault.legacy_transfer_protocol": "Übertragungsprotokoll / Hinweise",
    "vault.legacy_submit": "Anfrage einreichen",
    "vault.legacy_submitted": "Anfrage gesendet. Die Freigabe erfolgt nach Prüfung.",
    "vault.legacy_my_requests": "Ihre Legacy-Anfragen",
    "vault.legacy_pending": "Ausstehend",
    "vault.legacy_approved": "Freigegeben",
    "vault.legacy_rejected": "Abgelehnt",
    "vault.show_in_portfolio_again": "Wieder im Portfolio anzeigen",
    "vault.remove_from_portfolio": "Aus Portfolio entfernen",
    "vault.contracts_show": "Verträge anzeigen",
    "vault.total_value_shares": "Gesamtwert Anteile",
    "investor.market_performance": "Marktperformance",
    "service": "Service",
    "common.learn_more": "Mehr erfahren",
    "common.pdf": "PDF",
    "common.serial_id": "Seriennummer",
    "piece.rarity_unique": "Unikat",
    "piece.rarity_limited": "Limitiert",
    "piece.rarity_rare": "Selten",
    "piece.blockchain_verified": "Blockchain-verifiziert",
    "piece.edition": "Edition",
    "piece.add_to_favorites": "Zu Favoriten hinzufügen",
    "piece.remove_from_favorites": "Aus Favoriten entfernen",
    "common.signed": "Unterzeichnet",
    "vip.contact_for_details": "Bitte kontaktieren Sie Antonio Bellanova für VIP-Details.",
    "vip.benefit_early_access": "Zugang und Gebote bei privaten Auktionen 48 Stunden vor dem Start.",
    "vip.private_previews": "Private Vorschauen",
    "vip.benefit_previews": "Einladungen zu exklusiven Preview-Events in Köln und Mailand.",
    "vip.extended_warranty": "Erweiterte Garantie",
    "vip.benefit_warranty": "Lebenslange Echtheitsgarantie und kostenlose Wartung.",
    "vip.resale_priority": "Wiederverkaufs-Priorität",
    "vip.benefit_resale": "Prioritätslistung und geringere Provisionen beim Weiterverkauf.",
    "concierge.placeholder": "Wie können wir Sie heute unterstützen?",
    "chat.concierge": "Concierge",
    "chat.maison_concierge": "Maison Concierge",
    "chat.concierge_available": "Concierge verfügbar",
    "chat.concierge_busy": "Concierge beschäftigt",
    "chat.status_active": "Active",
    "chat.status_reviewing": "Reviewing",
    "chat.status_preparing": "Preparing Response",
    "chat.priority_channel_active": "Priority Channel Active",
    "chat.direct_line": "Direct Line",
    "chat.new_conversation": "Neue Unterhaltung",
    "chat.thread_asset": "Asset-Kommunikation",
    "chat.thread_vault": "Tresor-Anfrage",
    "chat.send": "Senden",
    "chat.type_message": "Nachricht eingeben…",
    "chat.no_threads": "Noch keine Gespräche.",
    "chat.priority": "Priorität",
    "chat.maison_typing": "Maison bereitet Antwort vor.",
    "ceremony.title": "Eigentumsübertragung",
    "ceremony.subtitle": "Antonio Bellanova Atelier",
    "ceremony.acquired_by": "Erworben von",
    "ceremony.quote": "Wahrer Luxus ist nicht nur der Besitz eines Objekts, sondern die Bewahrung eines Erbes. Heute werden Sie Hüter eines einzigartigen Meisterwerks.",
    "ceremony.enter_vault": "Zum Tresor",
    "ceremony.view_certificate": "Echtheitszertifikat ansehen",
    "resale.request_submitted": "Wiederverkauf zur Admin-Genehmigung eingereicht.",
    "resale.extern_transferred": "Extern transferiert",
    "resale.warranty_void": "Garantie erloschen",
    "resale.mark_external": "Als extern verkauft melden",
    "view.dashboard": "Dashboard",
    "view.marketplace": "Marktplatz",
    "view.drops": "Exklusive Drops",
    "view.auctions": "Auktionen",
    "view.vault": "Tresor",
    "view.admin": "Verwaltung",
    "view.portfolio": "Portfolio",
    "view.fractional": "Anteile",
    "view.investor": "Investor",
    "view.concierge": "Concierge",
    "view.login": "Anmelden",
    "view.register": "Registrieren",
    "common.back_home": "Zur Startseite",
    "common.back_dashboard": "Dashboard",
    "search.no_results": "Keine Stücke gefunden.",
    "contact.placeholder_name": "Name *",
    "contact.placeholder_email": "E-Mail *",
    "contact.placeholder_subject": "Betreff",
    "contact.placeholder_message": "Nachricht *",
    "contact.send": "Nachricht senden",
    "contact.sending": "Wird gesendet…",
    "contact.success": "Vielen Dank. Ihre Nachricht wurde gesendet. Wir melden uns in Kürze.",
    "contact.success_sent": "Nachricht gesendet. E-Mail an das Atelier wurde versandt.",
    "contact.error_send": "Fehler beim Senden.",
    "contact.goto_concierge": "Zum Concierge",
    "contact.intro": "Für Anfragen nutzen Sie bitte das Kontaktformular oder die Concierge-Funktion nach dem Login.",
    "notifications.empty_title": "Keine Benachrichtigungen",
    "notifications.empty_subtitle": "Sie sind auf dem neuesten Stand",
    "settings.shortcuts_title": "Tastaturkürzel",
    "marketplace.filter_placeholder": "Suche (Titel, Serial, Kategorie)",
    "vault.portfolio_pdf_btn": "Portfolio als PDF",
    "concierge.service_title": "Concierge Service",
    "shortcuts.close_modal": "Modals schließen",
    "shortcuts.focus_search": "Suche fokussieren",
    "shortcuts.this_help": "Diese Hilfe",
    "legal.open_google_maps": "In Google Maps öffnen",
    "vault.your_pieces": "Deine Stücke",
    "vault.your_pieces_desc": "Stücke aus deiner Sammlung kannst du hier aus der Portfolio-Anzeige nehmen oder wieder anzeigen.",
    "portfolio.curated_title": "The Curated Collection",
    "portfolio.curated_subtitle": "Eine Auswahl der bedeutendsten Werke von Antonio Bellanova – Handwerkskunst und Luxusdesign.",
    "concierge.direct_access": "Direkter Zugang zu Antonio",
    "concierge.vip_line_desc": "Als VIP-Mitglied haben Sie eine direkte Leitung zum Atelier. Anfragen für Maßanfertigungen, Privatbesichtigungen oder Beratung.",
    "concierge.vip_description": "Als VIP-Mitglied haben Sie eine direkte Leitung zum Atelier. Anfragen für Maßanfertigungen, Privatbesichtigungen oder Beratung.",
    "settings.password_changed": "Passwort wurde geändert.",
    "settings.password_change_error": "Fehler beim Ändern.",
    "settings.network_error": "Netzwerkfehler.",
    "settings.changing_password": "Wird geändert…",
    "settings.current_password": "Aktuelles Passwort",
    "settings.new_password": "Neues Passwort (min. 6 Zeichen)",
    "settings.confirm_password": "Neues Passwort bestätigen",
    "settings.password_min_length": "Neues Passwort mindestens 6 Zeichen.",
    "settings.password_mismatch": "Passwörter stimmen nicht überein.",
    "concierge.send_request": "Anfrage senden",
    "errors.invalid_credentials": "Ungültige Anmeldedaten.",
    "errors.cert_failed": "Zertifikat konnte nicht erstellt werden.",
    "errors.piece_create_failed": "Meisterwerk konnte nicht erstellt werden.",
    "errors.generic": "Ein Fehler ist aufgetreten.",
    "dashboard.welcome_subtitle": "Ihr Zugang zu den exklusivsten Schmuck- und Sammlerstücken. Verwalten Sie Ihre Werte, nehmen Sie an privaten Auktionen teil und entdecken Sie den Tresor.",
    "dashboard.member_since": "Mitglied seit",
    "dashboard.portfolio_value": "Portfolio-Wert",
    "dashboard.recent_views": "Zuletzt angesehen",
    "dashboard.favorites": "Favoriten",
    "dashboard.remove_favorite": "Favorit entfernen",
    "dashboard.active_orders": "Aktive Bestellungen",
    "dashboard.registry_entries": "Registry-Einträge",
    "registry.performance_title": "Registry & Performance",
    "registry.ownership_timeline": "Eigentümer-Verlauf",
    "registry.service_log": "Service-Historie",
    "registry.atelier_held": "Atelier (noch nicht veräußert)",
    "registry.rarity": "Seltenheit",
    "registry.demand_index": "Nachfrage-Index",
    "registry.prestige_index": "Prestige-Index",
    "registry.asset_performance": "Asset Performance",
    "registry.demand_score": "Indikativer Nachfrage-Score",
    "registry.resale_activity": "Wiederverkaufsaktivität",
    "registry.liquidity": "Liquidität",
    "registry.views": "Aufrufe",
    "registry.saves": "Gespeichert",
    "dashboard.value_development": "Wertentwicklung",
    "dashboard.resale_opportunities": "Wiederverkauf",
    "dashboard.service_restoration": "Service & Restaurierung",
    "identity.client_id": "Client-ID",
    "identity.prestige_level": "Prestige Level",
    "identity.member_tier": "Member Tier",
    "identity.asset_count": "Assets",
    "identity.vault_status": "Tresor-Status",
    "identity.vault_active": "Aktiv",
    "identity.vault_ready": "Bereit",
    "prestige.admin": "Administration",
    "prestige.client": "Client",
    "prestige.vip": "VIP",
    "prestige.royal": "Royal",
    "prestige.black": "Black",
    "prestige.reseller": "Reseller",
    "prestige.investor": "Investor",
    "prestige.viewer": "Viewer",
    "prestige.private_client": "Private Client",
    "prestige.collector": "Collector",
    "prestige.elite_collector": "Elite Collector",
    "prestige.royal_tier": "Royal Tier",
    "prestige.black_tier": "Black Tier",
    "delivery.insured_global": "Versicherter Weltversand",
    "delivery.armored_courier": "Bewaffneter Kurier",
    "delivery.personal_founder": "Persönliche Übergabe durch den Gründer",
    "delivery.private_viewing": "Privatbesichtigungstermin",
    "delivery.vault_storage": "Tresor-Lagerung",
    "delivery.select": "Lieferoption wählen",
    "drops.title": "Exklusive Drops",
    "drops.countdown": "Verfügbar in",
    "drops.ended": "Beendet",
    "private_terms.request": "Private Konditionen anfragen",
    "private_terms.requested": "Anfrage gesendet",
    "pricing.mode_fixed": "Festpreis",
    "pricing.mode_starting_from": "Ab-Preis",
    "pricing.mode_price_on_request": "Preis auf Anfrage",
    "pricing.mode_hidden": "Versteckt (nur Verhandlung)",
    "pricing.starting_from_label": "Ausführungen ab {price} €",
    "pricing.price_on_request": "Preis auf Anfrage",
    "search.placeholder": "Stück suchen…",
    "trust.secured_by": "Gesichert durch Antonio Bellanova",
    "trust.ssl_encrypted": "SSL verschlüsselt",
    "trust.dsgvo_compliant": "DSGVO-konform",
    "wishlist.on_list": "auf Wunschliste",
    "loading.please_wait": "Bitte warten",
    "offline.banner": "Sie sind offline. Einige Funktionen sind eingeschränkt.",
    "notifications.title": "Benachrichtigungen",
    "notifications.description": "Wählen Sie, wann Sie per E-Mail informiert werden möchten.",
    "notifications.email_messages": "Nachrichten & Concierge",
    "notifications.email_contracts": "Verträge & Dokumente",
    "notifications.email_auctions": "Auktionen & Gebote",
    "notifications.close": "Schließen",
    "notifications.change_password": "Passwort ändern",
    "filter.favorites_only": "Nur Favoriten",
    "filter.recent_only": "Nur zuletzt angesehen",
    "concierge.cta_title": "Maison Concierge",
    "concierge.cta_subtitle": "Persönliche Beratung, Termine & exklusive Anfragen — jederzeit für Sie da.",
    "concierge.secure_logged": "Sicherer Kanal · Kommunikation protokolliert",
    "auth.forgot_password": "Passwort vergessen",
    "auth.forgot_password_link": "Passwort vergessen?",
    "auth.preferred_language": "Bevorzugte Sprache",
    "auth.reset_invalid_token": "Kein gültiger Token. Nutzen Sie „Passwort vergessen“, um einen neuen Link zu erhalten.",
    "auth.back_to_login": "Zurück zum Login",
    "legal.ssl": "SSL verschlüsselt",
    "legal.secure_payment": "Sichere Zahlung",
    "compliance.footer": "Anwendbares Recht: Deutschland. Gerichtsstand: Köln. DSGVO-konform. Einwilligung und Datenzugriff gemäß Datenschutz.",
    "legal.imprint": "Impressum",
    "legal.privacy": "Datenschutz",
    "legal.terms": "AGB",
    "legal.contact": "Kontakt",
    "legal.directions": "Anfahrt",
    "compliance.footer": "Anwendbares Recht: Deutschland. Gerichtsstand: Köln. DSGVO-konform. Einwilligung und Datenauskunft gemäß Datenschutz.",
    "common.settings": "Einstellungen",
    "common.settings_saved": "Einstellungen gespeichert.",
    "common.views": "Aufrufe",
    "common.back_home": "Zur Startseite",
    "common.back_dashboard": "Dashboard",
    "search.no_results": "Keine Stücke gefunden.",
    "contact.placeholder_name": "Name *",
    "contact.placeholder_email": "E-Mail *",
    "contact.placeholder_subject": "Betreff",
    "contact.placeholder_message": "Nachricht *",
    "contact.send": "Nachricht senden",
    "contact.sending": "Wird gesendet…",
    "contact.success": "Vielen Dank. Ihre Nachricht wurde gesendet. Wir melden uns in Kürze.",
    "contact.to_concierge": "Zum Concierge",
    "notifications.empty_title": "Keine Benachrichtigungen",
    "notifications.empty_subtitle": "Sie sind auf dem neuesten Stand",
    "shortcuts.title": "Tastaturkürzel",
    "marketplace.filter_placeholder": "Suche (Titel, Serial, Kategorie)",
    "vault.portfolio_pdf_btn": "Portfolio als PDF",
    "concierge.service_title": "Concierge Service"
  },
  en: {
    dashboard: "Dashboard",
    marketplace: "Marketplace",
    auctions: "Auctions",
    vault: "The Vault",
    management: "Management",
    welcome: "Welcome to the Atelier",
    my_assets: "My Assets",
    certificates: "Certificates",
    active_bids: "Active Bids",
    membership: "Membership Status",
    featured: "Featured Masterpieces",
    request_acquisition: "Request Acquisition",
    reserved: "Reserved",
    sold: "Sold",
    resale_pending: "Resale Pending",
    resale_review: "In Review",
    sign_out: "Sign Out",
    view_details: "View Details",
    materials: "Materials",
    gemstones: "Gemstones",
    rarity: "Rarity",
    description: "Description",
    close: "Close",
    legal_notice: "By proceeding, you must review and sign the contractual documents related to this piece.",
    sign_contract: "Sign Contract",
    typed_signature: "Typed Signature",
    draw_signature: "Draw Signature",
    email_verification: "Email Verification",
    confirm_review: "I have reviewed and understood all documents.",
    signature_required: "Signature Required",
    clear: "Clear",
    verify: "Verify",
    ownership_pending: "Ownership Pending",
    ownership_transferred: "Ownership Transferred",
    payment_unlocked: "Payment Unlocked",
    waiting_signature: "Waiting Signature",
    payment_available: "Payment Available",
    piece_reserved: "Piece Reserved",
    payment_pending: "Payment Pending",
    completed: "Completed",
    signed: "Signed",
    login: "Log In",
    register: "Register",
    email: "Email",
    password: "Password",
    name: "Name",
    address: "Address",
    language: "Language",
    role: "Role",
    cancel: "Cancel",
    save: "Save",
    submit: "Submit",
    "roles.client": "Client",
    "roles.investor": "Investor",
    "roles.vip": "VIP",
    "roles.corporate": "Corporate",
    "roles.reseller": "Reseller",
    "roles.atelier_partner": "Atelier Partner",
    "roles.viewer": "Viewer (Read-only)",
    "roles.advisor": "Strategic Private Advisor (invitation only)",
    "auth.full_legal_name": "Full Legal Name",
    "auth.name_placeholder_id": "Name as on your ID",
    "auth.your_signature": "Your Signature",
    "auth.verification_code_sent": "A verification code will be sent to your registered email address.",
    "auth.sending": "Sending…",
    "auth.verified": "Verified",
    "auth.send_verification_code": "Send Verification Code",
    "auth.full_name": "Full Name",
    "auth.name_placeholder": "Antonio Bellanova",
    "auth.address_placeholder": "Ahorstraße 8, 50765 Cologne",
    "auth.access_role": "Access Role",
    "auth.email_placeholder": "name@vault.com",
    "auth.email_or_username": "Email or username",
    "auth.username": "Username",
    "auth.username_placeholder": "e.g. john_doe",
    "auth.password_placeholder": "••••••••",
    "auth.apply_vip": "Apply for VIP Membership",
    "auth.processing": "Processing…",
    "auth.sign_in": "Sign In",
    accept_contract: "Accept contract",
    "auth.create_account": "Create Account",
    "auth.register_success": "Registration successful. Please wait for admin approval.",
    "clear_signature": "Clear Signature",
    "cert.generated": "Certificate of Authenticity generated and stored in the user's vault.",
    "cert.title": "Certificate of Authenticity",
    "investor.title": "Investor",
    "investor.insights": "Insights",
    "investor.dataroom": "Data Room",
    "investor.total_value_shares": "Total value shares",
    "investor.my_shares": "My shares",
    "investor.market_performance": "Market Performance",
    "investor.request_access": "Request Access",
    "investor.request_allocation": "Request Allocation",
    "investor.request_allocation_desc": "Apply for priority access to upcoming drops.",
    "investor.schedule_meeting": "Schedule Meeting",
    "investor.schedule_meeting_desc": "Direct consultation with Antonio Bellanova.",
    "investor.vip_preview": "VIP Preview",
    "investor.vip_preview_desc": "Request early access to physical exhibitions.",
    "investor.request_share": "Buy share",
    "investor.request_share_desc": "Invest in fractional ownership of a physical masterpiece.",
    "investor.fractional_offers": "Available shares",
    "investor.request_share_pct": "Request share (%)",
    "investor.no_fractional_offers": "No shares currently offered for sale.",
    "investor.request_submitted": "Request submitted successfully. Our team will contact you shortly.",
    "admin.piece_created": "Masterpiece created successfully.",
    "admin.auction_created": "Auction created successfully.",
    "admin.piece_assigned": "Piece assigned successfully.",
    "admin.client_added": "Client added successfully. Access token created.",
    "admin.add_client": "Add New Client",
    "admin.vip_status": "VIP Status",
    "admin.create_client_btn": "Create Client & Vault",
    "admin.create_auction": "Create Auction",
    "admin.select_masterpiece": "Select Masterpiece",
    "admin.choose_piece": "Choose piece…",
    "admin.start_price": "Start Price (€)",
    "admin.end_time": "End Time",
    "admin.auction_terms": "Auction Terms",
    "admin.terms_placeholder": "Standard luxury auction terms apply…",
    "admin.vip_only": "VIP Early Access Only",
    "admin.start_auction": "Start Auction",
    "admin.assign_piece": "Assign Piece Manually",
    "admin.select_user": "Select User",
    "admin.choose_user": "Choose user…",
    "admin.assign_ownership": "Assign Ownership",
    "admin.pending_purchases": "Pending Purchases",
    "admin.approve": "Approve",
    "admin.reject": "Reject",
    "admin.deposit_contract": "Deposit Contract",
    "admin.deposit_draft": "Draft",
    "admin.deposit_signed": "Signed",
    "admin.no_pending_purchases": "No pending purchases.",
    "admin.active_workflows": "Active Workflows",
    "admin.resale_requests": "Resale Requests",
    "admin.resale_price": "Resale Price",
    "admin.no_resale_requests": "No pending resale requests.",
    "admin.commission": "Commission",
    "admin.commission_pct": "Commission (%)",
    "admin.min_price": "Minimum price",
    "admin.adjust_commission": "Adjust commission",
    "admin.prioritize_auction": "Prioritize auction",
    "admin.decision_curated": "Curated Marketplace",
    "admin.decision_auction": "Private Auction",
    "admin.decision_offer": "Private Offer",
    "admin.decision_buyback": "Maison Buyback",
    "admin.send_buyback_offer": "Send buyback offer",
    "admin.price_recommendation": "Price recommendation",
    "admin.market_stability": "Market stability",
    "admin.pending_payments": "Pending Payments",
    "admin.confirm_payment": "Confirm Payment",
    "admin.user_approvals": "User Approvals",
    "admin.wants_vip": "Wants VIP",
    "admin.no_pending_users": "No pending registrations.",
    "admin.investor_requests": "Investor Requests",
    "admin.request_type": "Request",
    "admin.investor_label": "Investor",
    "admin.no_investor_requests": "No investor requests.",
    "admin.approve_request": "Approve",
    "admin.reject_request": "Reject",
    "admin.fractional_offers": "Fractional offers",
    "admin.set_fractional_offer": "Offer shares",
    "admin.available_pct": "Available (%)",
    "admin.price_per_pct": "Price per % (€)",
    "admin.request_approved_msg": "Request approved. Access granted.",
    "admin.request_rejected_msg": "Request rejected.",
    "admin.signed_contracts": "Signed Contracts",
    "admin.deposit_contract_type": "Deposit Contract",
    "admin.purchase_contract_type": "Purchase Contract",
    "admin.customer": "Customer",
    "admin.piece_label": "Piece",
    "admin.signed_at": "Signed on",
    "admin.no_signed_contracts": "No signed contracts yet.",
    "admin.tab_overview": "Overview",
    "admin.tab_inventory": "Inventory",
    "admin.tab_users": "Users",
    "admin.tab_resale": "Resale",
    "admin.tab_appointments": "Appointments",
    "admin.tab_intelligence": "Intelligence",
    "admin.tab_legacy": "Legacy / Beneficiaries",
    "admin.tab_settings": "Settings",
    "admin.stat_revenue": "Total revenue",
    "admin.stat_active_users": "Active users",
    "admin.stat_pending_approvals": "Pending approvals",
    "admin.stat_masterpieces": "Masterpieces",
    "admin.stat_views": "Total views",
    "admin.stat_contact_requests": "Contact requests",
    "admin.stat_last_30_days": "last 30 days",
    "admin.popular_pieces_title": "Popular pieces (views + favorites)",
    "admin.export_inventory_csv": "Inventory CSV",
    "admin.appointments": "Appointments",
    "admin.schedule_appointment": "Schedule appointment",
    "admin.appointment_date": "Date",
    "admin.appointment_time": "Time",
    "admin.appointment_title": "Title",
    "admin.appointment_notes": "Notes",
    "admin.new_appointment": "New appointment",
    "admin.no_appointments": "No appointments.",
    "admin.open_tasks": "Open tasks",
    "admin.resale_no_decision": "Resale without decision",
    "admin.appointments_proposed": "Appointments proposed",
    "admin.atelier_moments": "Atelier moments",
    "admin.atelier_moments_desc": "Editorial moments for the dashboard. Order: top = shown first.",
    "admin.field_title": "Title",
    "admin.field_subtitle": "Subtitle",
    "admin.field_image_url": "Image URL",
    "admin.field_body_optional": "Body (optional)",
    "admin.add_button": "Add",
    "admin.save_button": "Save",
    "admin.save_saving": "Saving…",
    "admin.remove": "Remove",
    "admin.advisors": "Advisors",
    "admin.invite_advisor": "Invite",
    "admin.generate_password": "Generate password",
    "admin.password_for_advisor": "Password (choose or generate)",
    "admin.password_for_advisor_hint": "Leave empty: system generates one. Or enter or generate – then pass on verbally.",
    "admin.password_generated": "Password generated. You can pass it on verbally.",
    "admin.activate_advisor": "Activate",
    "admin.commission_override": "Commission rate",
    "admin.export_commissions": "Export commissions",
    "admin.manage_commissions": "Manage commissions",
    "admin.advisor_commissions": "Manage commissions",
    "admin.no_commissions": "No commissions.",
    "admin.no_pending_commissions": "No pending commissions.",
    "admin.commission_marked_paid": "Marked as paid.",
    "admin.mark_paid": "Mark paid",
    "admin.no_advisors": "No advisors.",
    "advisor.title": "Advisor",
    "advisor.overview": "Overview",
    "advisor.dashboard": "Dashboard",
    "advisor.clients": "Clients",
    "advisor.commissions": "Commissions",
    "advisor.contracts": "Contracts",
    "advisor.referred_clients": "Referred clients",
    "advisor.active_deals": "Active deals",
    "advisor.closed_deals": "Closed deals",
    "advisor.pending_commission": "Pending commission",
    "advisor.paid_commission": "Paid commission",
    "advisor.welcome_message": "Your overview: managed clients, deals and commissions.",
    "advisor.jurisdiction": "Jurisdiction: Germany, unless otherwise agreed.",
    "advisor.my_clients": "My clients",
    "advisor.add_client_email": "Client email",
    "advisor.link_client": "Link client",
    "advisor.client_linked": "Client linked.",
    "advisor.no_clients": "No clients yet.",
    "advisor.piece": "Piece",
    "advisor.advisor_name": "Advisor",
    "advisor.client_name": "Client",
    "advisor.sale_amount": "Sale amount",
    "advisor.commission_pct": "Rate",
    "advisor.commission_amount": "Commission",
    "advisor.status": "Status",
    "advisor.no_commissions": "No commissions yet.",
    "advisor.unsigned": "Unsigned",
    "advisor.contracts_download_hint": "Download contracts, review, then sign.",
    "advisor.download_contract": "Download",
    "advisor.download_error": "Download failed.",
    "advisor.advisor_agreement": "Framework agreement",
    "advisor.commission_agreement": "Commission agreement",
    "advisor.not_activated_title": "Access not yet activated",
    "advisor.not_activated_message": "Please sign the NDA under Contracts first and wait for administrator approval.",
    "view.advisor": "Advisor",
    "appointments.proposed": "Proposed",
    "appointments.confirmed": "Confirmed",
    "appointments.cancelled": "Cancelled",
    "appointments.my_appointments": "Your appointments",
    "appointments.accept": "Accept",
    "appointments.decline": "Decline",
    "appointments.no_appointments_user": "No appointments.",
    "marketplace.request_sent": "Acquisition request sent. Awaiting admin approval.",
    "marketplace.no_pieces": "No masterpieces currently available in the marketplace.",
    "marketplace.subtitle": "Exquisite pieces available for immediate acquisition.",
    "auctions.private_auctions": "Private Auctions",
    "auctions.subtitle": "Live bidding on rare and unique masterpieces.",
    "auctions.no_active": "No active auctions at this time.",
    "vault.no_pieces": "You don't own any pieces yet.",
    "vault.portfolio_pdf": "Portfolio (PDF)",
    "vault.portfolio_csv": "Portfolio CSV",
    "vault.export_my_data_gdpr": "Export my data (GDPR)",
    "vault.portfolio_overview": "Portfolio Overview",
    "vault.total_value": "Total value",
    "vault.legacy": "Legacy",
    "vault.legacy_title": "Legacy & Beneficiaries",
    "vault.legacy_subtitle": "Assign a beneficiary and store succession documentation. Activation requires approval by the Maison.",
    "vault.legacy_beneficiary_name": "Beneficiary name",
    "vault.legacy_beneficiary_contact": "Contact (email or phone)",
    "vault.legacy_transfer_protocol": "Transfer protocol / notes",
    "vault.legacy_submit": "Submit request",
    "vault.legacy_submitted": "Request sent. Approval is subject to review.",
    "vault.legacy_my_requests": "Your legacy requests",
    "vault.legacy_pending": "Pending",
    "vault.legacy_approved": "Approved",
    "vault.legacy_rejected": "Rejected",
    "vault.show_in_portfolio_again": "Show in portfolio again",
    "vault.remove_from_portfolio": "Remove from portfolio",
    "vault.contracts_show": "Show contracts",
    "vault.total_value_shares": "Total value shares",
    "investor.market_performance": "Market Performance",
    "service": "Service",
    "my_pieces": "My pieces",
    "contracts": "Contracts",
    "payments": "Payments",
    "my_bids": "My bids",
    "resale": "Resale",
    "vault.no_certs": "No certificates issued yet.",
    "my_pieces": "My pieces",
    "contracts": "Contracts",
    "payments": "Payments",
    "my_bids": "My bids",
    "resale": "Resale",
    "vip": "VIP",
    "common.learn_more": "Learn More",
    "common.pdf": "PDF",
    "common.serial_id": "Serial ID",
    "piece.rarity_unique": "Unique",
    "piece.rarity_limited": "Limited",
    "piece.rarity_rare": "Rare",
    "piece.blockchain_verified": "Blockchain verified",
    "piece.edition": "Edition",
    "piece.add_to_favorites": "Add to favorites",
    "piece.remove_from_favorites": "Remove from favorites",
    "common.signed": "Signed",
    "vip.contact_for_details": "Please contact Antonio Bellanova for VIP application details.",
    "vip.benefit_early_access": "View and bid on private auctions 48 hours before the general public.",
    "vip.private_previews": "Private Previews",
    "vip.benefit_previews": "Receive invitations to exclusive physical previews in Cologne and Milan.",
    "vip.extended_warranty": "Extended Warranty",
    "vip.benefit_warranty": "Lifetime authenticity guarantee and complimentary maintenance for all pieces.",
    "vip.resale_priority": "Resale Priority",
    "vip.benefit_resale": "Priority listing and lower commission rates for secondary market sales.",
    "concierge.placeholder": "How can we assist you today?",
    "chat.concierge": "Concierge",
    "chat.maison_concierge": "Maison Concierge",
    "chat.concierge_available": "Concierge Available",
    "chat.concierge_busy": "Concierge busy",
    "chat.status_active": "Active",
    "chat.status_reviewing": "Reviewing",
    "chat.status_preparing": "Preparing Response",
    "chat.priority_channel_active": "Priority Channel Active",
    "chat.direct_line": "Direct Line",
    "chat.new_conversation": "New conversation",
    "chat.thread_asset": "Asset communication",
    "chat.thread_vault": "Vault request",
    "chat.send": "Send",
    "chat.type_message": "Type a message…",
    "chat.no_threads": "No conversations yet.",
    "chat.priority": "Priority",
    "chat.maison_typing": "Maison is preparing a response.",
    "ceremony.title": "Ownership Transfer Ceremony",
    "ceremony.subtitle": "Antonio Bellanova Atelier",
    "ceremony.acquired_by": "Acquired by",
    "ceremony.quote": "True luxury is not merely the possession of an object, but the stewardship of a legacy. Today, you become the custodian of a singular masterpiece, handcrafted with precision and passion.",
    "ceremony.enter_vault": "Enter the Vault",
    "ceremony.view_certificate": "View Certificate of Authenticity",
    "resale.request_submitted": "Resale request submitted for admin approval.",
    "resale.extern_transferred": "Externally transferred",
    "resale.warranty_void": "Warranty void",
    "resale.mark_external": "Mark as externally sold",
    "view.dashboard": "Dashboard",
    "view.marketplace": "Marketplace",
    "view.drops": "Exclusive Drops",
    "view.auctions": "Auctions",
    "view.vault": "Vault",
    "view.admin": "Management",
    "view.portfolio": "Portfolio",
    "view.fractional": "Shares",
    "view.investor": "Investor",
    "view.concierge": "Concierge",
    "view.login": "Log In",
    "view.register": "Register",
    "common.back_home": "Back to home",
    "common.back_dashboard": "Dashboard",
    "search.no_results": "No pieces found.",
    "contact.placeholder_name": "Name *",
    "contact.placeholder_email": "Email *",
    "contact.placeholder_subject": "Subject",
    "contact.placeholder_message": "Message *",
    "contact.send": "Send message",
    "contact.sending": "Sending…",
    "contact.success": "Thank you. Your message has been sent. We will get back to you shortly.",
    "contact.success_sent": "Message sent. Email to the atelier has been sent.",
    "contact.error_send": "Error sending message.",
    "contact.goto_concierge": "To Concierge",
    "contact.intro": "For enquiries please use the contact form or the Concierge function after login.",
    "notifications.empty_title": "No notifications",
    "notifications.empty_subtitle": "You are up to date",
    "settings.shortcuts_title": "Keyboard shortcuts",
    "marketplace.filter_placeholder": "Search (title, serial, category)",
    "vault.portfolio_pdf_btn": "Portfolio as PDF",
    "concierge.service_title": "Concierge Service",
    "shortcuts.close_modal": "Close modals",
    "shortcuts.focus_search": "Focus search",
    "shortcuts.this_help": "This help",
    "legal.open_google_maps": "Open in Google Maps",
    "vault.your_pieces": "Your pieces",
    "vault.your_pieces_desc": "Pieces from your collection can be hidden from or shown again in the portfolio display.",
    "portfolio.curated_title": "The Curated Collection",
    "portfolio.curated_subtitle": "A selection of Antonio Bellanova's most significant works, showcasing the pinnacle of craftsmanship and luxury design.",
    "concierge.direct_access": "Direct Access to Antonio",
    "concierge.vip_line_desc": "As a VIP member, you have a direct line to our atelier. Request bespoke commissions, private viewings, or asset consultations.",
    "concierge.vip_description": "As a VIP member, you have a direct line to our atelier. Request bespoke commissions, private viewings, or asset consultations.",
    "settings.password_changed": "Password changed.",
    "settings.password_change_error": "Error changing password.",
    "settings.network_error": "Network error.",
    "settings.changing_password": "Changing…",
    "settings.current_password": "Current password",
    "settings.new_password": "New password (min. 6 characters)",
    "settings.confirm_password": "Confirm new password",
    "settings.password_min_length": "New password must be at least 6 characters.",
    "settings.password_mismatch": "Passwords do not match.",
    "concierge.send_request": "Send request",
    "errors.invalid_credentials": "Invalid credentials.",
    "errors.cert_failed": "Failed to generate certificate.",
    "errors.piece_create_failed": "Failed to create masterpiece.",
    "errors.generic": "Something went wrong.",
    "dashboard.welcome_subtitle": "Your portal to the world's most exclusive jewelry and collectible masterpieces. Manage your assets, participate in private auctions, and explore the vault.",
    "dashboard.member_since": "Member since",
    "dashboard.portfolio_value": "Portfolio Value",
    "dashboard.recent_views": "Recently viewed",
    "dashboard.favorites": "Favorites",
    "dashboard.remove_favorite": "Remove from favorites",
    "dashboard.active_orders": "Active Orders",
    "dashboard.registry_entries": "Registry Entries",
    "registry.performance_title": "Registry & Performance",
    "registry.ownership_timeline": "Ownership Timeline",
    "registry.service_log": "Service History",
    "registry.atelier_held": "Atelier (not yet sold)",
    "registry.rarity": "Rarity",
    "registry.demand_index": "Demand Index",
    "registry.prestige_index": "Prestige Index",
    "registry.asset_performance": "Asset Performance",
    "registry.demand_score": "Indicative Demand Score",
    "registry.resale_activity": "Resale Activity",
    "registry.liquidity": "Liquidity",
    "registry.views": "Views",
    "registry.saves": "Saves",
    "dashboard.value_development": "Value Development",
    "dashboard.resale_opportunities": "Resale Opportunities",
    "dashboard.service_restoration": "Service & Restoration",
    "identity.client_id": "Client ID",
    "identity.prestige_level": "Prestige Level",
    "identity.member_tier": "Member Tier",
    "identity.asset_count": "Assets",
    "identity.vault_status": "Vault Status",
    "identity.vault_active": "Active",
    "identity.vault_ready": "Ready",
    "prestige.admin": "Administration",
    "prestige.client": "Client",
    "prestige.vip": "VIP",
    "prestige.royal": "Royal",
    "prestige.black": "Black",
    "prestige.reseller": "Reseller",
    "prestige.investor": "Investor",
    "prestige.viewer": "Viewer",
    "prestige.private_client": "Private Client",
    "prestige.collector": "Collector",
    "prestige.elite_collector": "Elite Collector",
    "prestige.royal_tier": "Royal Tier",
    "prestige.black_tier": "Black Tier",
    "delivery.insured_global": "Insured Global Shipping",
    "delivery.armored_courier": "Armored Courier",
    "delivery.personal_founder": "Personal Delivery by Founder",
    "delivery.private_viewing": "Private Viewing Appointment",
    "delivery.vault_storage": "Vault Storage Option",
    "delivery.select": "Select delivery option",
    "drops.title": "Exclusive Drops",
    "drops.countdown": "Available in",
    "drops.ended": "Ended",
    "private_terms.request": "Request Private Terms",
    "private_terms.requested": "Request sent",
    "pricing.mode_fixed": "Fixed Price",
    "pricing.mode_starting_from": "Starting From Price",
    "pricing.mode_price_on_request": "Price On Request",
    "pricing.mode_hidden": "Hidden (Negotiation Only)",
    "pricing.starting_from_label": "From {price} €",
    "pricing.price_on_request": "Price on request",
    "search.placeholder": "Search pieces…",
    "trust.secured_by": "Secured by Antonio Bellanova",
    "trust.ssl_encrypted": "SSL Encrypted",
    "trust.dsgvo_compliant": "GDPR Compliant",
    "wishlist.on_list": "on wishlist",
    "loading.please_wait": "Please wait",
    "offline.banner": "You are offline. Some features are limited.",
    "notifications.title": "Notifications",
    "notifications.description": "Choose when you want to be notified by email.",
    "notifications.email_messages": "Messages & Concierge",
    "notifications.email_contracts": "Contracts & Documents",
    "notifications.email_auctions": "Auctions & Bids",
    "notifications.close": "Close",
    "notifications.change_password": "Change password",
    "filter.favorites_only": "Favorites only",
    "filter.recent_only": "Recently viewed only",
    "concierge.cta_title": "Maison Concierge",
    "concierge.cta_subtitle": "Personal advice, appointments & exclusive requests — here for you anytime.",
    "concierge.secure_logged": "Secure channel · Communication logged",
    "auth.forgot_password": "Forgot password",
    "auth.forgot_password_link": "Forgot password?",
    "auth.preferred_language": "Preferred language",
    "auth.reset_invalid_token": "Invalid token. Use \"Forgot password\" to get a new link.",
    "auth.back_to_login": "Back to login",
    "legal.ssl": "SSL Encrypted",
    "legal.secure_payment": "Secure payment",
    "compliance.footer": "Governing law: Germany. Jurisdiction: Cologne. GDPR compliant. Consent and data access as per Privacy Policy.",
    "legal.imprint": "Imprint",
    "legal.privacy": "Privacy",
    "legal.terms": "Terms & Conditions",
    "legal.contact": "Contact",
    "legal.directions": "Directions",
    "compliance.footer": "Governing law: Germany. Jurisdiction: Cologne. GDPR compliant. Consent and data access as per Privacy Policy.",
    "common.settings": "Settings",
    "common.settings_saved": "Settings saved.",
    "common.views": "Views",
    "common.back_home": "Back to home",
    "common.back_dashboard": "Dashboard",
    "search.no_results": "No pieces found.",
    "contact.placeholder_name": "Name *",
    "contact.placeholder_email": "Email *",
    "contact.placeholder_subject": "Subject",
    "contact.placeholder_message": "Message *",
    "contact.send": "Send message",
    "contact.sending": "Sending…",
    "contact.success": "Thank you. Your message has been sent. We will get back to you shortly.",
    "contact.to_concierge": "To Concierge",
    "notifications.empty_title": "No notifications",
    "notifications.empty_subtitle": "You are up to date",
    "shortcuts.title": "Keyboard shortcuts",
    "marketplace.filter_placeholder": "Search (title, serial, category)",
    "vault.portfolio_pdf_btn": "Portfolio as PDF",
    "concierge.service_title": "Concierge Service"
  },
  it: {
    dashboard: "Dashboard",
    marketplace: "Mercato",
    auctions: "Aste",
    vault: "Il Caveau",
    management: "Gestione",
    welcome: "Benvenuti nell'Atelier",
    my_assets: "I Miei Beni",
    certificates: "Certificati",
    active_bids: "Offerte Attive",
    membership: "Stato Membro",
    featured: "Capolavori in Primo Piano",
    request_acquisition: "Richiedi Acquisizione",
    reserved: "Riservato",
    sold: "Venduto",
    resale_pending: "Rivendita in Sospeso",
    resale_review: "In Revisione",
    sign_out: "Disconnetti",
    signed: "Firmato",
    login: "Accedi",
    register: "Registrati",
    email: "Email",
    password: "Password",
    name: "Nome",
    address: "Indirizzo",
    language: "Lingua",
    role: "Ruolo",
    cancel: "Annulla",
    save: "Salva",
    submit: "Invia",
    "roles.client": "Cliente",
    "roles.investor": "Investitore",
    "roles.vip": "VIP",
    "roles.corporate": "Azienda",
    "roles.reseller": "Rivenditore",
    "roles.atelier_partner": "Partner Atelier",
    "roles.viewer": "Solo lettura",
    "roles.advisor": "Strategic Private Advisor (solo su invito)",
    "auth.full_legal_name": "Nome completo",
    "auth.name_placeholder_id": "Nome come sul documento",
    "auth.your_signature": "La tua firma",
    "auth.verification_code_sent": "Un codice di verifica verrà inviato alla tua email.",
    "auth.sending": "Invio…",
    "auth.verified": "Verificato",
    "auth.send_verification_code": "Invia codice di verifica",
    "auth.full_name": "Nome completo",
    "auth.name_placeholder": "Antonio Bellanova",
    "auth.address_placeholder": "Ahorstraße 8, 50765 Colonia",
    "auth.access_role": "Ruolo di accesso",
    "auth.email_placeholder": "name@vault.com",
    "auth.email_or_username": "Email o nome utente",
    "auth.username": "Nome utente",
    "auth.username_placeholder": "es. mario_rossi",
    "auth.password_placeholder": "••••••••",
    "auth.apply_vip": "Richiedi adesione VIP",
    "auth.processing": "Elaborazione…",
    "auth.sign_in": "Accedi",
    accept_contract: "Accetta contratto",
    "auth.create_account": "Crea account",
    "auth.register_success": "Registrazione completata. Attendere l'approvazione.",
    "clear_signature": "Cancella firma",
    "cert.generated": "Certificato di autenticità generato e salvato nel caveau.",
    "cert.title": "Certificato di autenticità",
    "investor.title": "Investitore",
    "investor.insights": "Approfondimenti",
    "investor.dataroom": "Data Room",
    "investor.total_value_shares": "Valore totale quote",
    "investor.my_shares": "Le mie quote",
    "investor.market_performance": "Performance di mercato",
    "investor.request_access": "Richiedi accesso",
    "investor.request_allocation": "Richiedi allocazione",
    "investor.request_allocation_desc": "Accesso prioritario ai prossimi drop.",
    "investor.schedule_meeting": "Pianifica incontro",
    "investor.schedule_meeting_desc": "Consulenza diretta con Antonio Bellanova.",
    "investor.vip_preview": "Anteprima VIP",
    "investor.vip_preview_desc": "Accesso anticipato alle mostre.",
    "investor.request_share": "Acquista quota",
    "investor.request_share_desc": "Investi in quote di un capolavoro fisico.",
    "investor.fractional_offers": "Quote disponibili",
    "investor.request_share_pct": "Richiedi quota (%)",
    "investor.no_fractional_offers": "Nessuna quota in vendita al momento.",
    "investor.request_submitted": "Richiesta inviata. Il nostro team ti contatterà a breve.",
    "admin.piece_created": "Opera creata con successo.",
    "admin.auction_created": "Asta creata con successo.",
    "admin.piece_assigned": "Opera assegnata con successo.",
    "admin.client_added": "Cliente aggiunto. Token di accesso creato.",
    "admin.add_client": "Aggiungi cliente",
    "admin.vip_status": "Stato VIP",
    "admin.create_client_btn": "Crea cliente e caveau",
    "admin.create_auction": "Crea asta",
    "admin.select_masterpiece": "Seleziona opera",
    "admin.choose_piece": "Scegli opera…",
    "admin.start_price": "Prezzo di partenza (€)",
    "admin.end_time": "Data di fine",
    "admin.auction_terms": "Condizioni d'asta",
    "admin.terms_placeholder": "Condizioni standard asta luxury…",
    "admin.vip_only": "Solo accesso anticipato VIP",
    "admin.start_auction": "Avvia asta",
    "admin.assign_piece": "Assegna opera",
    "admin.select_user": "Seleziona utente",
    "admin.choose_user": "Scegli utente…",
    "admin.assign_ownership": "Assegna proprietà",
    "admin.pending_purchases": "Acquisti in sospeso",
    "admin.approve": "Approva",
    "admin.reject": "Rifiuta",
    "admin.deposit_contract": "Contratto di acconto",
    "admin.deposit_draft": "Bozza",
    "admin.deposit_signed": "Firmato",
    "admin.no_pending_purchases": "Nessun acquisto in sospeso.",
    "admin.active_workflows": "Workflow attivi",
    "admin.resale_requests": "Richieste di rivendita",
    "admin.resale_price": "Prezzo di rivendita",
    "admin.no_resale_requests": "Nessuna richiesta di rivendita.",
    "admin.commission": "Commissione",
    "admin.commission_pct": "Commissione (%)",
    "admin.min_price": "Prezzo minimo",
    "admin.adjust_commission": "Modifica commissione",
    "admin.prioritize_auction": "Priorità asta",
    "admin.decision_curated": "Mercato curato",
    "admin.decision_auction": "Asta privata",
    "admin.decision_offer": "Offerta privata",
    "admin.decision_buyback": "Riacquisto Maison",
    "admin.send_buyback_offer": "Invia offerta di riacquisto",
    "admin.price_recommendation": "Prezzo consigliato",
    "admin.market_stability": "Stabilità mercato",
    "admin.pending_payments": "Pagamenti in sospeso",
    "admin.confirm_payment": "Conferma pagamento",
    "admin.user_approvals": "Approvazioni utenti",
    "admin.wants_vip": "Desidera VIP",
    "admin.no_pending_users": "Nessuna registrazione in sospeso.",
    "admin.investor_requests": "Richieste investitori",
    "admin.request_type": "Richiesta",
    "admin.investor_label": "Investitore",
    "admin.no_investor_requests": "Nessuna richiesta investitori.",
    "admin.approve_request": "Approva",
    "admin.reject_request": "Rifiuta",
    "admin.fractional_offers": "Offerte quote",
    "admin.set_fractional_offer": "Offri quote",
    "admin.available_pct": "Disponibile (%)",
    "admin.price_per_pct": "Prezzo per % (€)",
    "admin.request_approved_msg": "Richiesta approvata. Accesso concesso.",
    "admin.request_rejected_msg": "Richiesta rifiutata.",
    "admin.signed_contracts": "Contratti firmati",
    "admin.deposit_contract_type": "Contratto di acconto",
    "admin.purchase_contract_type": "Contratto di acquisto",
    "admin.customer": "Cliente",
    "admin.piece_label": "Opera",
    "admin.signed_at": "Firmato il",
    "admin.no_signed_contracts": "Nessun contratto firmato.",
    "admin.tab_overview": "Panoramica",
    "admin.tab_inventory": "Inventario",
    "admin.tab_users": "Utenti",
    "admin.tab_resale": "Rivendita",
    "admin.tab_appointments": "Appuntamenti",
    "admin.tab_intelligence": "Intelligence",
    "admin.tab_legacy": "Legacy / Beneficiari",
    "admin.tab_settings": "Impostazioni",
    "admin.stat_revenue": "Fatturato totale",
    "admin.stat_active_users": "Utenti attivi",
    "admin.stat_pending_approvals": "Approvazioni in sospeso",
    "admin.stat_masterpieces": "Capolavori",
    "admin.stat_views": "Visualizzazioni totali",
    "admin.stat_contact_requests": "Richieste di contatto",
    "admin.stat_last_30_days": "ultimi 30 giorni",
    "admin.popular_pieces_title": "Opere popolari (visualizzazioni + preferiti)",
    "admin.export_inventory_csv": "Inventario CSV",
    "admin.appointments": "Appuntamenti",
    "admin.schedule_appointment": "Fissa appuntamento",
    "admin.appointment_date": "Data",
    "admin.appointment_time": "Ora",
    "admin.appointment_title": "Titolo",
    "admin.appointment_notes": "Note",
    "admin.new_appointment": "Nuovo appuntamento",
    "admin.no_appointments": "Nessun appuntamento.",
    "admin.open_tasks": "Attività aperte",
    "admin.resale_no_decision": "Rivendita senza decisione",
    "admin.appointments_proposed": "Appuntamenti proposti",
    "admin.atelier_moments": "Momenti atelier",
    "admin.atelier_moments_desc": "Momenti editoriali per la dashboard. Ordine: in alto = mostrato per primo.",
    "admin.field_title": "Titolo",
    "admin.field_subtitle": "Sottotitolo",
    "admin.field_image_url": "URL immagine",
    "admin.field_body_optional": "Corpo (opzionale)",
    "admin.add_button": "Aggiungi",
    "admin.save_button": "Salva",
    "admin.save_saving": "Salvataggio…",
    "admin.remove": "Rimuovi",
    "admin.advisors": "Consulenti",
    "admin.invite_advisor": "Invita",
    "admin.generate_password": "Genera password",
    "admin.password_for_advisor": "Password (scegli o genera)",
    "admin.password_for_advisor_hint": "Vuoto: il sistema ne genera una. Oppure inserisci o genera – poi comunicala verbalmente.",
    "admin.password_generated": "Password generata. Puoi comunicarla verbalmente.",
    "admin.activate_advisor": "Attiva",
    "admin.commission_override": "Commissione %",
    "admin.export_commissions": "Esporta commissioni",
    "admin.manage_commissions": "Gestisci commissioni",
    "admin.advisor_commissions": "Gestisci commissioni",
    "admin.no_commissions": "Nessuna commissione.",
    "admin.no_pending_commissions": "Nessuna commissione in sospeso.",
    "admin.commission_marked_paid": "Segnata come pagata.",
    "admin.mark_paid": "Segna come pagato",
    "admin.no_advisors": "Nessun consulente.",
    "advisor.title": "Consulente",
    "advisor.overview": "Panoramica",
    "advisor.dashboard": "Dashboard",
    "advisor.clients": "Clienti",
    "advisor.commissions": "Commissioni",
    "advisor.contracts": "Contratti",
    "advisor.referred_clients": "Clienti referenziati",
    "advisor.active_deals": "Deal attivi",
    "advisor.closed_deals": "Deal chiusi",
    "advisor.pending_commission": "Commissione in sospeso",
    "advisor.paid_commission": "Commissione pagata",
    "advisor.welcome_message": "Panoramica: clienti, deal e commissioni.",
    "advisor.jurisdiction": "Foro: Germania, salvo diverso accordo.",
    "advisor.my_clients": "I miei clienti",
    "advisor.add_client_email": "Email cliente",
    "advisor.link_client": "Collega cliente",
    "advisor.client_linked": "Cliente collegato.",
    "advisor.no_clients": "Nessun cliente ancora.",
    "advisor.piece": "Opera",
    "advisor.advisor_name": "Consulente",
    "advisor.client_name": "Cliente",
    "advisor.sale_amount": "Importo vendita",
    "advisor.commission_pct": "Percentuale",
    "advisor.commission_amount": "Commissione",
    "advisor.status": "Stato",
    "advisor.no_commissions": "Nessuna commissione ancora.",
    "advisor.unsigned": "Non firmato",
    "advisor.contracts_download_hint": "Scarica i contratti, verifica e poi firma.",
    "advisor.download_contract": "Scarica",
    "advisor.download_error": "Download fallito.",
    "advisor.advisor_agreement": "Accordo quadro",
    "advisor.commission_agreement": "Accordo commissioni",
    "advisor.not_activated_title": "Accesso non ancora attivato",
    "advisor.not_activated_message": "Firma prima il NDA nella sezione Contratti e attendi l'approvazione dell'amministratore.",
    "view.advisor": "Consulente",
    "appointments.proposed": "Proposto",
    "appointments.confirmed": "Confermato",
    "appointments.cancelled": "Annullato",
    "appointments.my_appointments": "I tuoi appuntamenti",
    "appointments.accept": "Accetta",
    "appointments.decline": "Rifiuta",
    "appointments.no_appointments_user": "Nessun appuntamento.",
    "marketplace.request_sent": "Richiesta di acquisizione inviata. In attesa di approvazione.",
    "marketplace.no_pieces": "Nessuna opera disponibile sul mercato.",
    "marketplace.subtitle": "Opere pregiate disponibili per acquisizione immediata.",
    "auctions.private_auctions": "Aste private",
    "auctions.subtitle": "Offerte in diretta su opere rare e uniche.",
    "auctions.no_active": "Nessuna asta attiva.",
    "vault.no_pieces": "Non possiedi ancora opere.",
    "vault.no_certs": "Nessun certificato emesso.",
    "vault.portfolio_pdf": "Portfolio (PDF)",
    "vault.portfolio_csv": "Portfolio CSV",
    "vault.export_my_data_gdpr": "Esporta i miei dati (GDPR)",
    "vault.portfolio_overview": "Panoramica portfolio",
    "vault.total_value": "Valore totale",
    "vault.legacy": "Legacy",
    "vault.legacy_title": "Legacy e beneficiari",
    "vault.legacy_subtitle": "Assegna un beneficiario e conserva la documentazione successoria. L'attivazione richiede l'approvazione della Maison.",
    "vault.legacy_beneficiary_name": "Nome del beneficiario",
    "vault.legacy_beneficiary_contact": "Contatto (email o telefono)",
    "vault.legacy_transfer_protocol": "Protocollo di trasferimento / note",
    "vault.legacy_submit": "Invia richiesta",
    "vault.legacy_submitted": "Richiesta inviata. L'approvazione è soggetta a revisione.",
    "vault.legacy_my_requests": "Le tue richieste legacy",
    "vault.legacy_pending": "In attesa",
    "vault.legacy_approved": "Approvato",
    "vault.legacy_rejected": "Rifiutato",
    "vault.show_in_portfolio_again": "Mostra di nuovo in portfolio",
    "vault.remove_from_portfolio": "Rimuovi dal portfolio",
    "vault.contracts_show": "Mostra contratti",
    "vault.total_value_shares": "Valore totale quote",
    "investor.market_performance": "Performance di mercato",
    "service": "Servizio",
    "my_pieces": "I miei pezzi",
    "contracts": "Contratti",
    "payments": "Pagamenti",
    "my_bids": "Le mie offerte",
    "resale": "Rivendita",
    "vip": "VIP",
    "common.learn_more": "Scopri di più",
    "common.pdf": "PDF",
    "common.serial_id": "Numero di serie",
    "piece.rarity_unique": "Unico",
    "piece.rarity_limited": "Limitato",
    "piece.rarity_rare": "Raro",
    "piece.blockchain_verified": "Verificato su blockchain",
    "piece.edition": "Edizione",
    "piece.add_to_favorites": "Aggiungi ai preferiti",
    "piece.remove_from_favorites": "Rimuovi dai preferiti",
    "common.signed": "Firmato",
    "vip.contact_for_details": "Contatta Antonio Bellanova per i dettagli VIP.",
    "vip.benefit_early_access": "Accesso e offerte 48 ore prima del pubblico.",
    "vip.private_previews": "Anteprime private",
    "vip.benefit_previews": "Inviti a preview esclusive a Colonia e Milano.",
    "vip.extended_warranty": "Garanzia estesa",
    "vip.benefit_warranty": "Garanzia di autenticità a vita e manutenzione inclusa.",
    "vip.resale_priority": "Priorità rivendita",
    "vip.benefit_resale": "Listing prioritario e commissioni ridotte.",
    "concierge.placeholder": "Come possiamo assisterti?",
    "chat.concierge": "Concierge",
    "chat.maison_concierge": "Maison Concierge",
    "chat.concierge_available": "Concierge disponibile",
    "chat.concierge_busy": "Concierge occupato",
    "chat.status_active": "Attivo",
    "chat.status_reviewing": "In revisione",
    "chat.status_preparing": "Preparazione risposta",
    "chat.priority_channel_active": "Canale prioritario attivo",
    "chat.direct_line": "Linea diretta",
    "chat.new_conversation": "Nuova conversazione",
    "chat.thread_asset": "Comunicazione asset",
    "chat.thread_vault": "Richiesta caveau",
    "chat.send": "Invia",
    "chat.type_message": "Scrivi un messaggio…",
    "chat.no_threads": "Nessuna conversazione.",
    "chat.priority": "Priorità",
    "chat.maison_typing": "La Maison sta preparando una risposta.",
    "ceremony.title": "Cerimonia di trasferimento proprietà",
    "ceremony.subtitle": "Antonio Bellanova Atelier",
    "ceremony.acquired_by": "Acquistato da",
    "ceremony.quote": "Il vero lusso non è possedere un oggetto, ma custodire un'eredità. Oggi diventi custode di un capolavoro unico.",
    "ceremony.enter_vault": "Entra nel caveau",
    "ceremony.view_certificate": "Vedi certificato di autenticità",
    "resale.request_submitted": "Richiesta di rivendita inviata per approvazione.",
    "resale.extern_transferred": "Trasferito esternamente",
    "resale.warranty_void": "Garanzia decaduta",
    "resale.mark_external": "Segnala come venduto esternamente",
    "view.dashboard": "Dashboard",
    "view.marketplace": "Mercato",
    "view.auctions": "Aste",
    "view.vault": "Caveau",
    "view.admin": "Gestione",
    "view.portfolio": "Portafoglio",
    "view.fractional": "Quote",
    "view.investor": "Investitore",
    "view.concierge": "Concierge",
    "view.login": "Accedi",
    "view.register": "Registrati",
    "common.back_home": "Torna alla home",
    "common.back_dashboard": "Dashboard",
    "search.no_results": "Nessuna opera trovata.",
    "contact.placeholder_name": "Nome *",
    "contact.placeholder_email": "Email *",
    "contact.placeholder_subject": "Oggetto",
    "contact.placeholder_message": "Messaggio *",
    "contact.send": "Invia messaggio",
    "contact.sending": "Invio in corso…",
    "contact.success": "Grazie. Il messaggio è stato inviato. Vi risponderemo al più presto.",
    "contact.success_sent": "Messaggio inviato. L'email all'atelier è stata inviata.",
    "contact.error_send": "Errore durante l'invio.",
    "contact.goto_concierge": "Al Concierge",
    "contact.intro": "Per richieste utilizzate il modulo di contatto o la funzione Concierge dopo l'accesso.",
    "notifications.empty_title": "Nessuna notifica",
    "notifications.empty_subtitle": "Sei aggiornato",
    "settings.shortcuts_title": "Scorciatoie da tastiera",
    "marketplace.filter_placeholder": "Cerca (titolo, seriale, categoria)",
    "vault.portfolio_pdf_btn": "Portfolio in PDF",
    "concierge.service_title": "Servizio Concierge",
    "errors.invalid_credentials": "Credenziali non valide.",
    "errors.cert_failed": "Impossibile generare il certificato.",
    "errors.piece_create_failed": "Impossibile creare l'opera.",
    "errors.generic": "Si è verificato un errore.",
    "dashboard.welcome_subtitle": "Il vostro accesso ai gioielli e ai capolavori da collezione più esclusivi. Gestite i vostri beni, partecipate alle aste private ed esplorate il caveau.",
    "dashboard.member_since": "Membro dal",
    "dashboard.portfolio_value": "Valore portafoglio",
    "dashboard.recent_views": "Visti di recente",
    "dashboard.favorites": "Preferiti",
    "dashboard.remove_favorite": "Rimuovi dai preferiti",
    "dashboard.active_orders": "Ordini attivi",
    "dashboard.registry_entries": "Voci registro",
    "registry.performance_title": "Registry e Performance",
    "registry.ownership_timeline": "Cronologia proprietà",
    "registry.service_log": "Storico assistenza",
    "registry.atelier_held": "Atelier (non ancora venduto)",
    "registry.rarity": "Rarità",
    "registry.demand_index": "Indice domanda",
    "registry.prestige_index": "Indice prestigio",
    "registry.asset_performance": "Performance asset",
    "registry.demand_score": "Punteggio domanda indicativo",
    "registry.resale_activity": "Attività rivendita",
    "registry.liquidity": "Liquidità",
    "registry.views": "Visualizzazioni",
    "registry.saves": "Salvati",
    "dashboard.value_development": "Sviluppo valore",
    "dashboard.resale_opportunities": "Rivendita",
    "dashboard.service_restoration": "Servizio e restauro",
    "identity.client_id": "ID cliente",
    "identity.prestige_level": "Prestige Level",
    "identity.member_tier": "Member Tier",
    "identity.asset_count": "Asset",
    "identity.vault_status": "Stato caveau",
    "identity.vault_active": "Attivo",
    "identity.vault_ready": "Pronto",
    "prestige.admin": "Amministrazione",
    "prestige.client": "Cliente",
    "prestige.vip": "VIP",
    "prestige.royal": "Royal",
    "prestige.black": "Black",
    "prestige.reseller": "Reseller",
    "prestige.investor": "Investor",
    "prestige.viewer": "Viewer",
    "prestige.private_client": "Private Client",
    "prestige.collector": "Collector",
    "prestige.elite_collector": "Elite Collector",
    "prestige.royal_tier": "Royal Tier",
    "prestige.black_tier": "Black Tier",
    "delivery.insured_global": "Spedizione globale assicurata",
    "delivery.armored_courier": "Corriere blindato",
    "delivery.personal_founder": "Consegna personale dal Fondatore",
    "delivery.private_viewing": "Appuntamento visione privata",
    "delivery.vault_storage": "Deposito in caveau",
    "delivery.select": "Seleziona opzione di consegna",
    "drops.title": "Drop esclusivi",
    "drops.countdown": "Disponibile tra",
    "drops.ended": "Terminato",
    "private_terms.request": "Richiedi condizioni private",
    "private_terms.requested": "Richiesta inviata",
    "pricing.mode_fixed": "Prezzo fisso",
    "pricing.mode_starting_from": "Prezzo a partire da",
    "pricing.mode_price_on_request": "Prezzo su richiesta",
    "pricing.mode_hidden": "Nascosto (solo trattativa)",
    "pricing.starting_from_label": "Esecuzioni da {price} €",
    "pricing.price_on_request": "Prezzo su richiesta",
    "search.placeholder": "Cerca opere…",
    "trust.secured_by": "Sicuro con Antonio Bellanova",
    "trust.ssl_encrypted": "Crittografia SSL",
    "trust.dsgvo_compliant": "Conforme GDPR",
    "wishlist.on_list": "in lista desideri",
    "loading.please_wait": "Attendere prego",
    "offline.banner": "Siete offline. Alcune funzioni sono limitate.",
    "notifications.title": "Notifiche",
    "notifications.description": "Scegliete quando volete ricevere notifiche via email.",
    "notifications.email_messages": "Messaggi e Concierge",
    "notifications.email_contracts": "Contratti e documenti",
    "notifications.email_auctions": "Aste e offerte",
    "notifications.close": "Chiudi",
    "notifications.change_password": "Cambia password",
    "filter.favorites_only": "Solo preferiti",
    "filter.recent_only": "Solo visti di recente",
    "concierge.cta_title": "Maison Concierge",
    "concierge.cta_subtitle": "Consulenza personale, appuntamenti e richieste esclusive — sempre a vostra disposizione.",
    "concierge.secure_logged": "Canale sicuro · Comunicazione registrata",
    "auth.forgot_password": "Password dimenticata",
    "auth.forgot_password_link": "Password dimenticata?",
    "auth.preferred_language": "Lingua preferita",
    "auth.reset_invalid_token": "Token non valido. Usate \"Password dimenticata\" per ottenere un nuovo link.",
    "auth.back_to_login": "Torna al login",
    "legal.ssl": "Crittografia SSL",
    "legal.secure_payment": "Pagamento sicuro",
    "compliance.footer": "Legge applicabile: Germania. Foro: Colonia. Conforme GDPR. Consenso e accesso dati come da Privacy.",
    "legal.imprint": "Impronta",
    "legal.privacy": "Privacy",
    "legal.terms": "Termini e condizioni",
    "legal.contact": "Contatto",
    "legal.directions": "Come arrivare",
    "compliance.footer": "Legge applicabile: Germania. Foro: Colonia. Conforme GDPR. Consenso e accesso ai dati secondo la Privacy.",
    "common.settings": "Impostazioni",
    "common.settings_saved": "Impostazioni salvate.",
    "common.views": "Visualizzazioni",
    "common.back_home": "Torna alla home",
    "common.back_dashboard": "Dashboard",
    "search.no_results": "Nessun pezzo trovato.",
    "shortcuts.close_modal": "Chiudi modali",
    "shortcuts.focus_search": "Focus ricerca",
    "shortcuts.this_help": "Questo aiuto",
    "legal.open_google_maps": "Apri in Google Maps",
    "vault.your_pieces": "I tuoi pezzi",
    "vault.your_pieces_desc": "I pezzi della tua collezione possono essere nascosti o mostrati di nuovo nel portfolio.",
    "portfolio.curated_title": "The Curated Collection",
    "portfolio.curated_subtitle": "Una selezione delle opere più significative di Antonio Bellanova, vertice di artigianato e design di lusso.",
    "concierge.direct_access": "Accesso diretto ad Antonio",
    "concierge.vip_description": "Come membro VIP hai una linea diretta con l'atelier. Richiedi commissioni su misura, visioni private o consulenze.",
    "settings.password_changed": "Password modificata.",
    "settings.password_change_error": "Errore durante la modifica.",
    "settings.network_error": "Errore di rete.",
    "settings.changing_password": "Modifica in corso…",
    "settings.current_password": "Password attuale",
    "settings.new_password": "Nuova password (min. 6 caratteri)",
    "settings.confirm_password": "Conferma nuova password",
    "settings.password_min_length": "La nuova password deve avere almeno 6 caratteri.",
    "settings.password_mismatch": "Le password non coincidono.",
    "contact.placeholder_name": "Nome *",
    "contact.placeholder_email": "Email *",
    "contact.placeholder_subject": "Oggetto",
    "contact.placeholder_message": "Messaggio *",
    "contact.send": "Invia messaggio",
    "contact.sending": "Invio in corso…",
    "contact.success": "Grazie. Il suo messaggio è stato inviato. La contatteremo a breve.",
    "contact.to_concierge": "Al Concierge",
    "notifications.empty_title": "Nessuna notifica",
    "notifications.empty_subtitle": "Sei aggiornato",
    "shortcuts.title": "Scorciatoie da tastiera",
    "marketplace.filter_placeholder": "Cerca (titolo, seriale, categoria)",
    "vault.portfolio_pdf_btn": "Portfolio in PDF",
    "concierge.service_title": "Servizio Concierge",
    "shortcuts.close_modal": "Chiudi modali",
    "shortcuts.focus_search": "Focus ricerca",
    "shortcuts.this_help": "Questo aiuto",
    "legal.open_google_maps": "Apri in Google Maps",
    "vault.your_pieces": "I tuoi pezzi",
    "vault.your_pieces_desc": "Qui puoi nascondere o mostrare di nuovo i pezzi della tua collezione nella vista portfolio.",
    "portfolio.curated_title": "The Curated Collection",
    "portfolio.curated_subtitle": "Una selezione delle opere più significative di Antonio Bellanova, artigianalità e design di lusso.",
    "concierge.direct_access": "Accesso diretto ad Antonio",
    "concierge.vip_line_desc": "Come membro VIP hai una linea diretta con l'atelier. Richiedi commissioni su misura, visioni private o consulenze.",
    "concierge.vip_description": "Come membro VIP hai una linea diretta con l'atelier. Richiedi commissioni su misura, visioni private o consulenze.",
    "settings.password_changed": "Password modificata.",
    "settings.password_change_error": "Errore durante la modifica.",
    "settings.network_error": "Errore di rete.",
    "settings.changing_password": "Modifica in corso…",
    "settings.current_password": "Password attuale",
    "settings.new_password": "Nuova password (min. 6 caratteri)",
    "settings.confirm_password": "Conferma nuova password",
    "settings.password_min_length": "La nuova password deve avere almeno 6 caratteri.",
    "settings.password_mismatch": "Le password non coincidono.",
    "concierge.send_request": "Invia richiesta"
  },
  fr: {} as Record<string, string>,
  ar: {} as Record<string, string>,
  zh: {} as Record<string, string>,
  es: {} as Record<string, string>
};
// Fill fr, ar, zh, es from en so all languages have keys; override with translations below
(function () {
  const en = TRANSLATIONS.en as Record<string, string>;
  const fill = (lang: 'fr' | 'ar' | 'zh' | 'es', overrides: Record<string, string>) => {
    TRANSLATIONS[lang] = { ...en, ...overrides };
  };
  fill('fr', { dashboard: "Tableau de bord", marketplace: "Marché", auctions: "Enchères", vault: "Coffre", management: "Gestion", welcome: "Bienvenue à l'Atelier", login: "Connexion", register: "S'inscrire", "auth.sign_in": "Connexion", "auth.create_account": "Créer un compte", "view.portfolio": "Portefeuille", "view.admin": "Gestion", "investor.title": "Investisseur", "cert.title": "Certificat d'authenticité", "ceremony.enter_vault": "Entrer dans le coffre", "ceremony.view_certificate": "Voir le certificat", sign_out: "Déconnexion", "auth.processing": "Traitement…", "admin.approve": "Approuver", "admin.reject": "Refuser" });
  fill('ar', { dashboard: "لوحة التحكم", marketplace: "السوق", auctions: "المزادات", vault: "الخزينة", login: "تسجيل الدخول", register: "التسجيل", "auth.sign_in": "تسجيل الدخول", "auth.create_account": "إنشاء حساب", "cert.title": "شهادة الأصالة", "view.portfolio": "المحفظة", "view.admin": "الإدارة", "investor.title": "مستثمر", "ceremony.enter_vault": "الدخول إلى الخزينة", "ceremony.view_certificate": "عرض شهادة الأصالة", sign_out: "تسجيل الخروج", "auth.processing": "جاري المعالجة…", "admin.approve": "موافقة", "admin.reject": "رفض" });
  fill('zh', { dashboard: "仪表板", marketplace: "市场", auctions: "拍卖", vault: "金库", login: "登录", register: "注册", "auth.sign_in": "登录", "auth.create_account": "创建账户", "cert.title": "真品证书", "view.portfolio": "投资组合", "view.admin": "管理", "investor.title": "投资者", "ceremony.enter_vault": "进入金库", "ceremony.view_certificate": "查看真品证书", sign_out: "退出", "auth.processing": "处理中…", "admin.approve": "批准", "admin.reject": "拒绝" });
  fill('es', { dashboard: "Panel", marketplace: "Mercado", auctions: "Subastas", vault: "Bóveda", login: "Iniciar sesión", register: "Registrarse", "auth.sign_in": "Iniciar sesión", "auth.create_account": "Crear cuenta", "cert.title": "Certificado de autenticidad", "view.portfolio": "Cartera", "view.admin": "Gestión", "investor.title": "Inversor", "ceremony.enter_vault": "Entrar en la bóveda", "ceremony.view_certificate": "Ver certificado", sign_out: "Cerrar sesión", "auth.processing": "Procesando…", "admin.approve": "Aprobar", "admin.reject": "Rechazar" });
})();

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const base = "min-h-[44px] px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants: any = {
    primary: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 hover:shadow-amber-600/25",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
    outline: "bg-transparent border border-amber-600/50 text-amber-500 hover:bg-amber-600/10 hover:border-amber-500/60",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
    danger: "bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20"
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, icon: Icon, className = '' }: any) => (
  <div className={`space-y-1.5 w-full ${className}`}>
    {label && <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 ${Icon ? 'pl-12' : 'px-4'} pr-4 text-zinc-200 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20 transition-all`}
      />
    </div>
  </div>
);

const Card = ({ children, className = '', hoverGlow }: any) => (
  <div className={`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 transition-all duration-300 ${hoverGlow ? 'card-hover-glow' : ''} ${className}`}>
    {children}
  </div>
);

const SkeletonCard = () => (
  <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl overflow-hidden">
    <div className="aspect-square skeleton" />
    <div className="p-6 space-y-3">
      <div className="h-5 w-3/4 skeleton rounded" />
      <div className="h-4 w-1/2 skeleton rounded" />
      <div className="h-3 w-full skeleton rounded" />
      <div className="h-3 w-2/3 skeleton rounded" />
      <div className="h-10 w-full skeleton rounded-full mt-4" />
    </div>
  </div>
);

const PremiumEmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="py-12 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-amber-500/70" />
    </div>
    <p className="font-serif italic text-zinc-400 text-lg">{title}</p>
    {subtitle && <p className="text-xs text-zinc-600 uppercase tracking-widest mt-2">{subtitle}</p>}
  </div>
);

const Badge = ({ children, variant = 'default', icon: Icon }: any) => {
  const variants: any = {
    default: "bg-zinc-800 text-zinc-400",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    vip: "bg-gradient-to-r from-amber-600/20 to-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-900/20",
    verified: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    outline: "bg-transparent border border-zinc-700 text-zinc-400",
    zinc: "bg-zinc-800/80 text-zinc-400 border border-zinc-700"
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-widest font-bold ${variants[variant] || variants.default}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

const SignaturePad = ({ onSave, onClear, t }: { onSave: (v: string) => void; onClear: () => void; t?: (k: string) => string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL());
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    onClear();
  };

  return (
    <div className="space-y-4">
      <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[200px]"
        />
      </div>
      <button onClick={clear} className="text-xs text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-bold">{t ? t('clear_signature') : 'Clear Signature'}</button>
    </div>
  );
};

const SignatureModal = ({ contract, onClose, onSign, t, signError }: any) => {
  const [method, setMethod] = useState<'typed' | 'drawn' | 'email'>('typed');
  const [typedName, setTypedName] = useState('');
  const [drawnData, setDrawnData] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSign = () => {
    setLocalError(null);
    if (!hasReviewed) {
      setLocalError(t ? (t('confirm_review') || 'Bitte bestätigen Sie, dass Sie alle Dokumente gelesen haben.') : 'Bitte bestätigen Sie, dass Sie alle Dokumente gelesen haben.');
      return;
    }
    const data = method === 'typed' ? typedName.trim() : method === 'drawn' ? drawnData : 'verified-email';
    if (method === 'typed' && data.length < 2) {
      setLocalError(t ? (t('auth.full_legal_name') || 'Bitte geben Sie Ihren vollständigen Namen ein.') : 'Bitte geben Sie Ihren vollständigen Namen ein.');
      return;
    }
    if (method === 'drawn' && data.length < 100) {
      setLocalError(t ? (t('clear_signature') ? 'Bitte zeichnen Sie Ihre Signatur.' : 'Bitte zeichnen Sie Ihre Signatur im dafür vorgesehenen Feld.') : 'Bitte zeichnen Sie Ihre Signatur im dafür vorgesehenen Feld.');
      return;
    }
    if (method === 'email' && !emailVerified) {
      setLocalError(t ? (t('auth.verification_code_sent') || 'Bitte bestätigen Sie Ihre E-Mail.') : 'Bitte bestätigen Sie Ihre E-Mail.');
      return;
    }
    onSign(contract.id, method, data);
  };

  const canSign = hasReviewed && (
    (method === 'typed' && typedName.length > 2) ||
    (method === 'drawn' && drawnData.length > 100) ||
    (method === 'email' && emailVerified)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-serif italic text-white">{t('signature_required')}</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">{contract.doc_ref}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Plus className="w-6 h-6 text-zinc-500 rotate-45" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl h-fit">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-2">
                <p className="text-zinc-200 text-sm leading-relaxed">{t('legal_notice')}</p>
                <label className="flex items-center gap-3 cursor-pointer group pt-2">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${hasReviewed ? 'bg-amber-600 border-amber-600' : 'border-zinc-700 group-hover:border-amber-600/50'}`}>
                    {hasReviewed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={hasReviewed} onChange={(e) => setHasReviewed(e.target.checked)} />
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-widest font-semibold">{t('confirm_review')}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              {(['typed', 'drawn', 'email'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${method === m ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {t(`${m}_signature`)}
                </button>
              ))}
            </div>

            <div className="min-h-[240px] flex flex-col justify-center">
              {method === 'typed' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <Input 
                    label={t('auth.full_legal_name')} 
                    placeholder={t('auth.name_placeholder_id')} 
                    value={typedName} 
                    onChange={(e: any) => setTypedName(e.target.value)}
                  />
                  <div className="p-6 border border-zinc-800 border-dashed rounded-2xl text-center">
                    <p className="font-serif italic text-3xl text-zinc-400 opacity-50 select-none">{typedName || t('auth.your_signature')}</p>
                  </div>
                </div>
              )}

              {method === 'drawn' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <SignaturePad onSave={setDrawnData} onClear={() => setDrawnData('')} t={t} />
                </div>
              )}

              {method === 'email' && (
                <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
                    <Mail className="w-12 h-12 text-amber-500 mx-auto opacity-50" />
                    <p className="text-zinc-400 text-sm">{t('auth.verification_code_sent')}</p>
                    <Button 
                      variant="outline" 
                      className="mx-auto" 
                      disabled={isVerifying}
                      onClick={() => {
                        setIsVerifying(true);
                        setTimeout(() => {
                          setIsVerifying(false);
                          setEmailVerified(true);
                        }, 1500);
                      }}
                    >
                      {isVerifying ? t('auth.sending') : emailVerified ? t('auth.verified') : t('auth.send_verification_code')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-zinc-950 border-t border-zinc-800 space-y-4">
          {(signError || localError) && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3" role="alert">
              {signError || localError}
            </p>
          )}
          <div className="flex gap-4">
            <Button variant="ghost" onClick={onClose} className="flex-1">{t('cancel')}</Button>
          <Button 
            variant="primary" 
            disabled={!canSign} 
            onClick={handleSign}
            className="flex-[2]"
          >
            <Signature className="w-4 h-4" />
            {t('sign_digitally')}
          </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function ForgotPasswordForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<'idle' | 'success' | 'error'>('idle');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage('idle');
    try {
      const res = await fetch('/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }), credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage('success');
        setTimeout(onSuccess, 2000);
      } else {
        setMessage('error');
      }
    } catch {
      setMessage('error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-zinc-400">Geben Sie Ihre E-Mail ein. Wir senden Ihnen einen Link zum Zurücksetzen des Passworts.</p>
      <Input label="E-Mail" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="ihre@email.de" required />
      {message === 'success' && <p className="text-sm text-emerald-500">Falls ein Konto existiert, wurde ein Link versendet. Prüfen Sie Ihr Postfach.</p>}
      {message === 'error' && <p className="text-sm text-red-400">Fehler beim Senden. Bitte später erneut versuchen.</p>}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Zurück</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Wird gesendet…' : 'Link anfordern'}</Button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ token, onBack, onSuccess }: { token: string; onBack: () => void; onSuccess: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Mindestens 6 Zeichen.'); return; }
    if (newPassword !== confirm) { setError('Passwörter stimmen nicht überein.'); return; }
    if (!token) { setError('Kein gültiger Link. Bitte fordern Sie einen neuen an.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword }), credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Link abgelaufen oder ungültig.');
      }
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };
  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">{t('auth.reset_invalid_token')}</p>
        <Button variant="outline" onClick={onBack}>{t('auth.back_to_login')}</Button>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input label="Neues Passwort" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="Min. 6 Zeichen" required />
      <Input label="Passwort bestätigen" type="password" value={confirm} onChange={(e: any) => setConfirm(e.target.value)} placeholder="Wiederholen" required />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Abbrechen</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Wird gespeichert…' : 'Passwort setzen'}</Button>
      </div>
    </form>
  );
}

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'dashboard' | 'marketplace' | 'auctions' | 'drops' | 'vault' | 'admin' | 'advisor' | 'portfolio' | 'investor' | 'concierge' | 'verify' | 'fractional' | 'impressum' | 'datenschutz' | 'agb' | 'kontakt' | 'anfahrt'>(() => {
    if (typeof window === 'undefined') return 'login';
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'reset-password' && params.get('token')) return 'reset-password';
    if (v === 'forgot-password') return 'forgot-password';
    return 'login';
  });
  const [resetPasswordToken, setResetPasswordToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('token') || '';
  });
  const [vaultTab, setVaultTab] = useState<'pieces' | 'certs' | 'contracts' | 'payments' | 'auctions' | 'resale' | 'service' | 'vip' | 'investor_insights' | 'dataroom' | 'legacy'>('pieces');
  const [clientLegacyRequests, setClientLegacyRequests] = useState<any[]>([]);
  const [legacyForm, setLegacyForm] = useState({ beneficiary_name: '', beneficiary_contact: '', transfer_protocol: '' });
  const [serviceRequestForm, setServiceRequestForm] = useState({ masterpieceId: '' as number | '', type: 'restoration', description: '' });
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [masterpieces, setMasterpieces] = useState<Masterpiece[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [vaultData, setVaultData] = useState<{ pieces: Masterpiece[], certs: Certificate[], contracts: Contract[], portfolio_hidden_ids?: number[] }>({ pieces: [], certs: [], contracts: [] });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminContracts, setAdminContracts] = useState<any[]>([]);
  const [language, setLanguage] = useState('de');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (typeof window !== 'undefined' && (localStorage.getItem('vault-theme') as 'dark' | 'light')) || 'dark');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Masterpiece | null>(null);
  const [deliveryOptionForModal, setDeliveryOptionForModal] = useState<string>('insured_global_shipping');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [workflows, setWorkflows] = useState<Record<number, PurchaseWorkflow>>({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [contractToSign, setContractToSign] = useState<Contract | null>(null);
  const [contractSignError, setContractSignError] = useState<string | null>(null);
  const [investorAnalytics, setInvestorAnalytics] = useState<InvestorAnalytics | null>(null);
  const [investorRequests, setInvestorRequests] = useState<InvestorRequest[]>([]);
  const [adminInvestorRequests, setAdminInvestorRequests] = useState<any[]>([]);
  const [adminResaleListings, setAdminResaleListings] = useState<any[]>([]);
  const [adminAppointments, setAdminAppointments] = useState<Appointment[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [adminRevenue, setAdminRevenue] = useState<any>(null);
  const [adminCashflow, setAdminCashflow] = useState<any>(null);
  const [adminResaleRevenue, setAdminResaleRevenue] = useState<any>(null);
  const [adminBankConfig, setAdminBankConfig] = useState<any>({});
  const [adminGdprRequests, setAdminGdprRequests] = useState<any[]>([]);
  const [adminServiceRequests, setAdminServiceRequests] = useState<any[]>([]);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [appointmentModalRequest, setAppointmentModalRequest] = useState<any>(null);
  const [appointmentScheduleForm, setAppointmentScheduleForm] = useState({ date: '', time: '09:00', title: '', notes: '' });
  const [newAppointmentForm, setNewAppointmentForm] = useState({ userId: '', date: '', time: '09:00', title: '', notes: '' });
  const [deletePieceConfirm, setDeletePieceConfirm] = useState<{ piece: Masterpiece; password: string; error: string } | null>(null);
  const [editingPiece, setEditingPiece] = useState<(Masterpiece & { description_i18n?: string; materials_i18n?: string; gemstones_i18n?: string }) | null>(null);
  const [editPieceForm, setEditPieceForm] = useState<Record<string, any>>({});
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedChatThread, setSelectedChatThread] = useState<ChatThread | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conciergeStatus, setConciergeStatus] = useState<ConciergeAvailability[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const selectedThreadIdRef = useRef<number | null>(null);
  selectedThreadIdRef.current = selectedChatThread?.id ?? null;
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [dataroomContent, setDataroomContent] = useState<any>(null);
  const [dataroomPieceId, setDataroomPieceId] = useState<number | ''>('');
  const [exitSimulation, setExitSimulation] = useState<any>(null);
  const [investorPortfolio, setInvestorPortfolio] = useState<{ shares: any[]; total_fractional_value: number } | null>(null);
  const [fractionalOffers, setFractionalOffers] = useState<any[]>([]);
  const [adminFractionalOffers, setAdminFractionalOffers] = useState<any[]>([]);
  const [shareRequestForm, setShareRequestForm] = useState({ masterpieceId: '' as number | '', percentage: 5 });
  const [fractionalOfferForm, setFractionalOfferForm] = useState({ masterpieceId: '' as number | '', available_pct: 20, price_per_pct: '' as number | '' });
  const [filterSearch, setFilterSearch] = useState('');
  const [filterRarity, setFilterRarity] = useState('');
  const [filterMarketScope, setFilterMarketScope] = useState<'all' | 'favorites' | 'recent'>('all');
  const [sortMarket, setSortMarket] = useState<'newest' | 'price_asc' | 'price_desc' | 'title'>('newest');
  const assetViewStartRef = useRef<number | null>(null);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem('vault-recently-viewed') || '[]'); } catch { return []; } });
  const [dropsList, setDropsList] = useState<any[]>([]);
  const [registryData, setRegistryData] = useState<Record<number, any>>({});
  const [performanceData, setPerformanceData] = useState<Record<number, any>>({});
  const [showRegistryInModal, setShowRegistryInModal] = useState(false);
  const [pieceModalImageIndex, setPieceModalImageIndex] = useState(0);
  const [verifyCertId, setVerifyCertId] = useState<string | null>(null);
  const [verifyData, setVerifyData] = useState<{ cert: any; piece: any; owner_name: string | null } | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<{ message: string } | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<{ email_messages: boolean; email_contracts: boolean; email_auctions: boolean }>({ email_messages: true, email_contracts: true, email_auctions: true });
  const [atelierMoments, setAtelierMoments] = useState<{ id: string; title: string; subtitle?: string; image_url?: string; body?: string }[]>([]);
  const [showNotificationPrefsModal, setShowNotificationPrefsModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showMarketplacePdfModal, setShowMarketplacePdfModal] = useState(false);
  const [marketplacePdfLang, setMarketplacePdfLang] = useState<'de' | 'en' | 'it'>('de');
  const [changePasswordForm, setChangePasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [adminContactRequests, setAdminContactRequests] = useState<{ id: number; name: string; email: string; subject: string | null; message: string; created_at: string }[]>([]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormSent, setContactFormSent] = useState(false);
  const [adminAtelierMoments, setAdminAtelierMoments] = useState<{ id?: string; title: string; subtitle?: string; image_url?: string; body?: string }[]>([]);
  const [adminAtelierForm, setAdminAtelierForm] = useState({ title: '', subtitle: '', image_url: '', body: '' });
  const [adminTab, setAdminTab] = useState<'overview' | 'inventory' | 'users' | 'resale' | 'appointments' | 'advisors' | 'intelligence' | 'legacy' | 'settings'>('overview');
  const [intelligenceClientProfiles, setIntelligenceClientProfiles] = useState<any[]>([]);
  const [intelligenceAdvisorAnalytics, setIntelligenceAdvisorAnalytics] = useState<any[]>([]);
  const [intelligenceScarcityHeatmap, setIntelligenceScarcityHeatmap] = useState<any[]>([]);
  const [adminLegacyRequests, setAdminLegacyRequests] = useState<any[]>([]);
  const [adminAdvisors, setAdminAdvisors] = useState<any[]>([]);
  const [adminAdvisorCommissions, setAdminAdvisorCommissions] = useState<any[]>([]);
  const [lastInvitedAdvisorPassword, setLastInvitedAdvisorPassword] = useState<{ email: string; password: string } | null>(null);
  const [advisorDashboard, setAdvisorDashboard] = useState<any>(null);
  const [advisorClients, setAdvisorClients] = useState<any[]>([]);
  const [advisorCommissions, setAdvisorCommissions] = useState<any[]>([]);
  const [advisorContracts, setAdvisorContracts] = useState<any[]>([]);
  const [advisorTab, setAdvisorTab] = useState<'dashboard' | 'clients' | 'commissions' | 'contracts'>('dashboard');
  const [advisorNewClientEmail, setAdvisorNewClientEmail] = useState('');
  const [advisorNotActivated, setAdvisorNotActivated] = useState(false);
  const [adminAtelierSaving, setAdminAtelierSaving] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filterMasterpieces = (list: Masterpiece[], statusFilter?: string) => {
    let out = list;
    if (statusFilter) out = out.filter(p => p.status === statusFilter);
    if (filterSearch.trim()) {
      const q = filterSearch.trim().toLowerCase();
      out = out.filter(p => (p.title?.toLowerCase().includes(q)) || (p.serial_id?.toLowerCase().includes(q)) || (p.category?.toLowerCase().includes(q)));
    }
    if (filterRarity) out = out.filter(p => p.rarity === filterRarity);
    if (filterMarketScope === 'favorites' && user) out = out.filter(p => favoriteIds.includes(p.id));
    if (filterMarketScope === 'recent' && user) out = out.filter(p => recentlyViewedIds.includes(p.id));
    if (sortMarket === 'price_asc') out = [...out].sort((a, b) => (Number(a.valuation) || 0) - (Number(b.valuation) || 0));
    else if (sortMarket === 'price_desc') out = [...out].sort((a, b) => (Number(b.valuation) || 0) - (Number(a.valuation) || 0));
    else if (sortMarket === 'title') out = [...out].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else out = [...out].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return out;
  };

  const handleGenerateCertificate = async (masterpieceId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterpieceId, adminId: user.id })
      });
      if (res.ok) {
        notifyUser(t('cert.generated'), 'success');
        fetchData();
      } else {
        const err = await res.json();
        notifyUser(err.error || t('errors.cert_failed'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const t = (key: string) => TRANSLATIONS[language]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;

  const lang = (language || 'de').toLowerCase().slice(0, 2);
  const getPieceLocalized = (piece: any, field: 'description' | 'materials' | 'gemstones'): string => {
    const i18n = piece[`${field}_i18n`];
    const fallback = piece[field] ?? '';
    if (!i18n) return fallback;
    try {
      const obj = typeof i18n === 'string' ? JSON.parse(i18n) : i18n;
      return (obj && typeof obj === 'object' && (obj[lang] ?? obj['en'] ?? obj['de'])) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const getPieceLocalizedWithLang = (piece: any, field: 'description' | 'materials' | 'gemstones', langCode: string): string => {
    const i18n = piece[`${field}_i18n`];
    const fallback = piece[field] ?? '';
    if (!i18n) return fallback;
    try {
      const obj = typeof i18n === 'string' ? JSON.parse(i18n) : i18n;
      return (obj && typeof obj === 'object' && (obj[langCode] ?? obj['en'] ?? obj['de'])) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const getRarityLabel = (rarity: string): string => {
    const r = (rarity || '').toLowerCase();
    if (r === 'unique' || r === 'unikat') return t('piece.rarity_unique');
    if (r === 'limitiert' || r === 'limited') return t('piece.rarity_limited');
    if (r === 'selten' || r === 'rare') return t('piece.rarity_rare');
    return rarity || t('piece.rarity_unique');
  };

  const getPiecePriceDisplay = (piece: Masterpiece & { pricing_mode?: string; hide_price?: number; price_visibility_rules?: string }, currentUser?: { prestige_tier?: string } | null) => {
    const mode = piece.pricing_mode ?? (piece.hide_price ? 'hidden' : 'fixed');
    let forceRequest = false;
    if ((mode === 'fixed' || mode === 'starting_from') && piece.price_visibility_rules && typeof piece.price_visibility_rules === 'string' && piece.price_visibility_rules.trim()) {
      try {
        const allowed = JSON.parse(piece.price_visibility_rules) as string[];
        const tier = currentUser?.prestige_tier ?? 'client';
        if (!Array.isArray(allowed) || !allowed.includes(tier)) forceRequest = true;
      } catch (_) {}
    }
    if (forceRequest) return { label: t('pricing.price_on_request'), showInquiry: true, showNegotiation: false };
    const val = piece.valuation != null ? Number(piece.valuation) : 0;
    if (mode === 'hidden') return { label: t('private_terms.request'), showInquiry: false, showNegotiation: true };
    if (mode === 'price_on_request') return { label: t('pricing.price_on_request'), showInquiry: true, showNegotiation: false };
    if (mode === 'starting_from') return { label: (t('pricing.starting_from_label') as string).replace('{price}', val > 0 ? val.toLocaleString('de-DE') : '—'), showInquiry: false, showNegotiation: false };
    return { label: val > 0 ? `${val.toLocaleString('de-DE')} €` : '—', showInquiry: false, showNegotiation: false };
  };

  const RARITY_KEYS: Record<string, string> = { Unique: 'piece.rarity_unique', Unikat: 'piece.rarity_unique', Limitiert: 'piece.rarity_limited', Limited: 'piece.rarity_limited', Selten: 'piece.rarity_rare', Rare: 'piece.rarity_rare' };
  const getPieceRarityLabel = (rarity: string) => t(RARITY_KEYS[rarity] || rarity);

  const getPieceImages = (piece: { image_url?: string; image_urls?: string }) => {
    if (!piece) return [];
    try {
      const urls = typeof piece.image_urls === 'string' && piece.image_urls.trim() ? JSON.parse(piece.image_urls) : null;
      if (Array.isArray(urls) && urls.length > 0) return urls;
    } catch (_) {}
    return piece.image_url ? [piece.image_url] : [];
  };

  const getPieceLocalizedForLang = (piece: any, field: 'description' | 'materials' | 'gemstones', lang: string): string => {
    const i18n = piece[`${field}_i18n`];
    const fallback = piece[field] ?? '';
    if (!i18n) return fallback;
    try {
      const obj = typeof i18n === 'string' ? JSON.parse(i18n) : i18n;
      return (obj && typeof obj === 'object' && (obj[lang] ?? obj['en'] ?? obj['de'])) ?? fallback;
    } catch { return fallback; }
  };

  const loadImageAsDataUrl = (url: string): Promise<string | null> =>
    new Promise((resolve) => {
      if (url.startsWith('data:')) {
        resolve(url);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = Math.min(img.naturalWidth, 400);
          c.height = Math.min(img.naturalHeight, 400);
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL('image/jpeg', 0.85));
          } else resolve(null);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const downloadMarketplacePdf = async (lang: 'de' | 'en' | 'it') => {
    const PDF_LABELS: Record<string, Record<string, string>> = {
      de: { title: 'Marktplatz', description: 'Beschreibung', materials: 'Materialien', gemstones: 'Edelsteine', serial_id: 'Seriennummer', price_on_request: 'Preis auf Anfrage', from: 'Ab', rarity: 'Seltenheit' },
      en: { title: 'Marketplace', description: 'Description', materials: 'Materials', gemstones: 'Gemstones', serial_id: 'Serial ID', price_on_request: 'Price on request', from: 'From', rarity: 'Rarity' },
      it: { title: 'Mercato', description: 'Descrizione', materials: 'Materiali', gemstones: 'Pietre preziose', serial_id: 'Numero di serie', price_on_request: 'Prezzo su richiesta', from: 'Da', rarity: 'Rarità' }
    };
    const L = PDF_LABELS[lang] || PDF_LABELS.de;
    const list = filterMasterpieces(masterpieces, 'available');
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;
    doc.setFontSize(18);
    doc.text(`Antonio Bellanova — ${L.title}`, margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'it' ? 'it-IT' : 'en-GB'), margin, y);
    y += 14;
    for (let i = 0; i < list.length; i++) {
      const piece = list[i] as Masterpiece & { pricing_mode?: string; description_i18n?: string; materials_i18n?: string; gemstones_i18n?: string };
      if (y > 250) { doc.addPage(); y = 20; }
      const mode = piece.pricing_mode ?? (piece.hide_price ? 'hidden' : 'fixed');
      let priceText = '';
      if (mode === 'price_on_request' || mode === 'hidden') priceText = L.price_on_request;
      else if (mode === 'starting_from') priceText = `${L.from} ${(piece.valuation != null ? Number(piece.valuation).toLocaleString('de-DE') : '—')} €`;
      else priceText = piece.valuation != null ? `${Number(piece.valuation).toLocaleString('de-DE')} €` : '—';
      const imgList = getPieceImages(piece);
      const imgUrl = imgList[0] || piece.image_url;
      let dataUrl: string | null = null;
      if (imgUrl && (imgUrl.startsWith('data:') || imgUrl.startsWith('http'))) {
        if (imgUrl.startsWith('data:')) dataUrl = imgUrl;
        else dataUrl = await loadImageAsDataUrl(imgUrl);
      }
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, 'JPEG', margin, y, 35, 35);
        } catch (_) {}
      }
      const hasImg = !!dataUrl;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text((piece.title || '').substring(0, 50), hasImg ? margin + 40 : margin, y + 8);
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`${L.serial_id}: ${piece.serial_id || '—'}`, hasImg ? margin + 40 : margin, y + 16);
      doc.text(priceText, hasImg ? margin + 40 : margin, y + 22);
      if (piece.rarity) doc.text(`${L.rarity}: ${piece.rarity}`, hasImg ? margin + 40 : margin, y + 28);
      doc.setFontSize(8);
      const desc = getPieceLocalizedForLang(piece, 'description', lang);
      const descLines = doc.splitTextToSize(desc || '—', pageW - margin * 2 - (hasImg ? 45 : 0));
      doc.text(L.description + ': ', hasImg ? margin + 40 : margin, y + (piece.rarity ? 36 : 34));
      doc.text(descLines.slice(0, 5), hasImg ? margin + 40 : margin, y + (piece.rarity ? 42 : 40));
      const mat = getPieceLocalizedForLang(piece, 'materials', lang);
      const gem = getPieceLocalizedForLang(piece, 'gemstones', lang);
      doc.text(`${L.materials}: ${(mat || '—').substring(0, 50)}`, margin, y + (hasImg ? 58 : 56));
      doc.text(`${L.gemstones}: ${(gem || '—').substring(0, 50)}`, margin, y + 64);
      y += (hasImg ? 78 : 72);
    }
    doc.save(`Antonio-Bellanova-Marktplatz-${lang.toUpperCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  useEffect(() => { setPieceModalImageIndex(0); }, [selectedPiece?.id]);

  useEffect(() => {
    if (!editingPiece) return;
    let descI18n: Record<string, string> = {};
    let matI18n: Record<string, string> = {};
    let gemI18n: Record<string, string> = {};
    try {
      if (editingPiece.description_i18n) descI18n = typeof editingPiece.description_i18n === 'string' ? JSON.parse(editingPiece.description_i18n) : editingPiece.description_i18n;
      if (editingPiece.materials_i18n) matI18n = typeof editingPiece.materials_i18n === 'string' ? JSON.parse(editingPiece.materials_i18n) : editingPiece.materials_i18n;
      if (editingPiece.gemstones_i18n) gemI18n = typeof editingPiece.gemstones_i18n === 'string' ? JSON.parse(editingPiece.gemstones_i18n) : editingPiece.gemstones_i18n;
    } catch (_) {}
    const images: string[] = getPieceImages(editingPiece);
    setEditPieceForm({
      title: editingPiece.title ?? '',
      serial_id: editingPiece.serial_id ?? '',
      category: (editingPiece as any).category ?? 'Jewelry',
      description: editingPiece.description ?? '',
      description_en: descI18n.en ?? '',
      description_it: descI18n.it ?? '',
      materials: editingPiece.materials ?? '',
      materials_en: matI18n.en ?? '',
      materials_it: matI18n.it ?? '',
      gemstones: editingPiece.gemstones ?? '',
      gemstones_en: gemI18n.en ?? '',
      gemstones_it: gemI18n.it ?? '',
      valuation: editingPiece.valuation ?? '',
      deposit_pct: editingPiece.deposit_pct ?? 50,
      rarity: editingPiece.rarity ?? 'Unique',
      production_time: (editingPiece as any).production_time ?? '',
      cert_data: (editingPiece as any).cert_data ?? '',
      pricing_mode: (editingPiece as any).pricing_mode ?? 'fixed',
      price_visibility_rules: (editingPiece as any).price_visibility_rules ?? '',
      image_url: editingPiece.image_url ?? '',
      image_urls: images.length > 0 ? images : []
    });
  }, [editingPiece]);

  const handleSaveEditPiece = async () => {
    if (!editingPiece) return;
    setLoading(true);
    try {
      const description_i18n = [editPieceForm.description, editPieceForm.description_en, editPieceForm.description_it].some(Boolean)
        ? { de: editPieceForm.description || undefined, en: editPieceForm.description_en?.trim() || undefined, it: editPieceForm.description_it?.trim() || undefined }
        : undefined;
      const materials_i18n = [editPieceForm.materials, editPieceForm.materials_en, editPieceForm.materials_it].some(Boolean)
        ? { de: editPieceForm.materials || undefined, en: editPieceForm.materials_en?.trim() || undefined, it: editPieceForm.materials_it?.trim() || undefined }
        : undefined;
      const gemstones_i18n = [editPieceForm.gemstones, editPieceForm.gemstones_en, editPieceForm.gemstones_it].some(Boolean)
        ? { de: editPieceForm.gemstones || undefined, en: editPieceForm.gemstones_en?.trim() || undefined, it: editPieceForm.gemstones_it?.trim() || undefined }
        : undefined;
      const res = await fetch(`/api/admin/masterpieces/${editingPiece.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPieceForm.title,
          serial_id: editPieceForm.serial_id,
          category: editPieceForm.category,
          description: editPieceForm.description,
          materials: editPieceForm.materials,
          gemstones: editPieceForm.gemstones,
          description_i18n,
          materials_i18n,
          gemstones_i18n,
          valuation: parseFloat(editPieceForm.valuation) || 0,
          deposit_pct: parseFloat(editPieceForm.deposit_pct) || 50,
          rarity: editPieceForm.rarity,
          production_time: editPieceForm.production_time,
          cert_data: editPieceForm.cert_data,
          pricing_mode: editPieceForm.pricing_mode,
          price_visibility_rules: editPieceForm.price_visibility_rules || undefined,
          image_url: editPieceForm.image_url,
          image_urls: Array.isArray(editPieceForm.image_urls) && editPieceForm.image_urls.length > 0 ? editPieceForm.image_urls : undefined
        })
      });
      if (res.ok) {
        notifyUser(t('admin.piece_created'), 'success');
        setEditingPiece(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        notifyUser(err.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [wantsVip, setWantsVip] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT);

  // Admin Forms
  const [newPiece, setNewPiece] = useState({ 
    title: '', 
    serial_id: '', 
    category: 'Jewelry',
    description: '', 
    materials: '', 
    gemstones: '', 
    description_en: '', description_it: '',
    materials_en: '', materials_it: '',
    gemstones_en: '', gemstones_it: '',
    valuation: '', 
    rarity: 'Unique', 
    production_time: '4-6 Weeks',
    cert_data: '',
    deposit_pct: '50', 
    image: '',
    images: [] as string[],
    pricing_mode: 'fixed' as 'fixed' | 'starting_from' | 'price_on_request' | 'hidden'
  });
  const [newAuction, setNewAuction] = useState({
    masterpieceId: '', startPrice: '', endTime: '', vipOnly: false
  });
  const [assignPiece, setAssignPiece] = useState({
    userId: '', masterpieceId: ''
  });
  const [newClient, setNewClient] = useState({ name: '', email: '', address: '', role: 'client', isVip: false });

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const m = hash.match(/^#?\/?verify\/(.+)/);
    if (m) {
      setView('verify');
      setVerifyCertId(decodeURIComponent(m[1].replace(/\/$/, '')));
      return;
    }
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUser(data);
          setLanguage(data.language || 'de');
          setView('dashboard');
          if (data.notification_prefs) {
            try {
              const prefs = typeof data.notification_prefs === 'string' ? JSON.parse(data.notification_prefs) : data.notification_prefs;
              if (prefs && typeof prefs === 'object') setNotificationPrefs(prev => ({ ...prev, ...prefs }));
            } catch (_) {}
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (verifyCertId) {
      fetch(`/api/verify/certificate/${encodeURIComponent(verifyCertId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(setVerifyData)
        .catch(() => setVerifyData(null));
    } else setVerifyData(null);
  }, [verifyCertId]);

  useEffect(() => {
    try { localStorage.setItem('vault-recently-viewed', JSON.stringify(recentlyViewedIds.slice(0, 6))); } catch (_) {}
  }, [recentlyViewedIds]);

  useEffect(() => {
    document.title = view === 'login' || view === 'register' ? 'Juwelen & Schmuckatelier Antonio Bellanova' : view === 'verify' ? 'Zertifikat prüfen' : `${(view as string).replace(/_/g, ' ')} · Juwelen & Schmuckatelier Antonio Bellanova`;
  }, [view]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPiece) closePieceDetail();
        else if (contractToSign) setContractToSign(null);
        else if (showNotifications) setShowNotifications(false);
        else if (showNotificationPrefsModal) setShowNotificationPrefsModal(false);
        else if (showPasswordChangeModal) setShowPasswordChangeModal(false);
        else if (showShortcutsModal) setShowShortcutsModal(false);
        else if (selectedCert) setSelectedCert(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        (document.querySelector('.global-search-input') as HTMLInputElement)?.focus();
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) setShowShortcutsModal(prev => !prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPiece, contractToSign, showNotifications, showNotificationPrefsModal, showPasswordChangeModal, showShortcutsModal, selectedCert]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(typeof window !== 'undefined' && window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      setupWebSocket();
      (window as any).handleGenerateCertificate = handleGenerateCertificate;
    }
    return () => ws.current?.close();
  }, [user]);

  useEffect(() => {
    if (!user || view !== 'concierge') return;
    fetch(`/api/communication/threads?userId=${user.id}`).then(r => r.json()).then(setChatThreads).catch(() => {});
    fetch(`/api/communication/concierge/status`).then(r => r.json()).then(setConciergeStatus).catch(() => {});
  }, [user, view]);

  useEffect(() => {
    if (!selectedChatThread || !user) {
      setChatMessages([]);
      return;
    }
    fetch(`/api/communication/threads/${selectedChatThread.id}/messages?userId=${user.id}`).then(r => r.json()).then(setChatMessages).catch(() => setChatMessages([]));
  }, [selectedChatThread?.id, user]);

  useEffect(() => {
    if (user) fetch(`/api/analytics/favorites?userId=${user.id}`).then(r => r.json()).then(setFavoriteIds).catch(() => {});
  }, [user?.id]);
  const prevViewRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevViewRef.current !== 'admin' && view === 'admin') setAdminAtelierMoments([...atelierMoments]);
    prevViewRef.current = view;
  }, [view, atelierMoments]);

  useEffect(() => {
    if (selectedPiece?.id) {
      setRecentlyViewedIds(prev => [selectedPiece.id, ...prev.filter(id => id !== selectedPiece.id)].slice(0, 6));
    }
  }, [selectedPiece?.id]);

  useEffect(() => {
    const pieceId = selectedPiece?.id;
    if (pieceId && user) assetViewStartRef.current = Date.now();
    return () => {
      if (user?.id && pieceId && assetViewStartRef.current) {
        const durationSeconds = Math.round((Date.now() - assetViewStartRef.current) / 1000);
        fetch('/api/analytics/asset-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, masterpieceId: pieceId, durationSeconds })
        }).catch(() => {});
        assetViewStartRef.current = null;
      }
    };
  }, [selectedPiece?.id, user?.id]);

  const closePieceDetail = () => {
    if (user && selectedPiece && assetViewStartRef.current) {
      const durationSeconds = Math.round((Date.now() - assetViewStartRef.current) / 1000);
      fetch('/api/analytics/asset-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, masterpieceId: selectedPiece.id, durationSeconds })
      }).catch(() => {});
      assetViewStartRef.current = null;
    }
    setSelectedPiece(null);
    setShowRegistryInModal(false);
  };

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}`);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS Message:", data);
      
      if (data.type === 'NEW_BID') {
        setAuctions(prev => prev.map(a => 
          a.id === data.auctionId 
            ? { ...a, current_bid: data.amount, highest_bidder_id: data.userId } 
            : a
        ));
      } else if (data.type === 'CHAT_MESSAGE' && data.message) {
        setChatMessages(prev => (data.threadId === selectedThreadIdRef.current ? [...prev, data.message] : prev));
      } else if (data.type === 'CONCIERGE_STATUS') {
        setConciergeStatus(prev => {
          const next = prev.filter((c: ConciergeAvailability) => c.admin_id !== data.adminId);
          next.push({ id: 0, admin_id: data.adminId, status: data.status, updated_at: new Date().toISOString() });
          return next;
        });
      } else {
        fetchData(); // Refresh on other updates
      }
    };
  };

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyUser = (msg: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ msg, type });
    toastTimeoutRef.current = setTimeout(() => { setToast(null); toastTimeoutRef.current = null; }, 4000);
  };

  const fetchData = async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const [piecesRes, auctionsRes, vaultRes, payRes, notifRes, dropsRes] = await Promise.all([
        fetch('/api/masterpieces'),
        fetch(`/api/auctions?userId=${user.id}`),
        fetch(`/api/vault/${user.id}`),
        fetch(`/api/payments/${user.id}`),
        fetch(`/api/notifications/${user.id}`),
        fetch('/api/drops', { credentials: 'include' })
      ]);

      if (piecesRes.ok) setMasterpieces(await piecesRes.json());
      if (auctionsRes.ok) setAuctions(await auctionsRes.json());
      if (vaultRes.ok) setVaultData(await vaultRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (dropsRes.ok) setDropsList(await dropsRes.json());

      if (user.role === UserRole.ADMIN) {
        const [statsRes, usersRes, contractsRes, invReqRes, resaleListingsRes, appointmentsRes, auditRes, revenueRes, cashflowRes, resaleRevRes, bankRes, gdprRes, fracOffersRes, serviceReqRes, contactReqRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users'),
          fetch('/api/admin/contracts'),
          fetch('/api/admin/investor-requests'),
          fetch('/api/admin/resale-listings'),
          fetch('/api/admin/appointments'),
          fetch('/api/admin/audit-logs?limit=100'),
          fetch('/api/admin/revenue-dashboard'),
          fetch('/api/admin/cashflow'),
          fetch('/api/admin/resale-revenue'),
          fetch('/api/admin/bank-config'),
          fetch('/api/admin/gdpr/data-requests'),
          fetch('/api/admin/fractional-offers'),
          fetch('/api/admin/service-requests'),
          fetch('/api/admin/contact-requests')
        ]);
        if (statsRes.ok) setAdminStats(await statsRes.json());
        if (usersRes.ok) setAllUsers(await usersRes.json());
        if (contractsRes.ok) setAdminContracts(await contractsRes.json());
        if (invReqRes.ok) setAdminInvestorRequests(await invReqRes.json());
        if (resaleListingsRes.ok) setAdminResaleListings(await resaleListingsRes.json());
        if (appointmentsRes.ok) setAdminAppointments(await appointmentsRes.json());
        if (auditRes.ok) setAdminAuditLogs(await auditRes.json());
        if (revenueRes.ok) setAdminRevenue(await revenueRes.json());
        if (cashflowRes.ok) setAdminCashflow(await cashflowRes.json());
        if (resaleRevRes.ok) setAdminResaleRevenue(await resaleRevRes.json());
        if (bankRes.ok) setAdminBankConfig(await bankRes.json());
        if (gdprRes.ok) setAdminGdprRequests(await gdprRes.json());
        if (fracOffersRes.ok) setAdminFractionalOffers(await fracOffersRes.json());
        if (serviceReqRes.ok) setAdminServiceRequests(await serviceReqRes.json());
        if (contactReqRes.ok) setAdminContactRequests(await contactReqRes.json());
        const advisorsRes = await fetch('/api/admin/advisors');
        if (advisorsRes.ok) setAdminAdvisors(await advisorsRes.json());
        const commissionsRes = await fetch('/api/admin/advisors/commissions');
        if (commissionsRes.ok) setAdminAdvisorCommissions(await commissionsRes.json());
        if (adminTab === 'intelligence') {
          const [cpRes, aaRes, shRes] = await Promise.all([fetch('/api/admin/intelligence/client-profiles', { credentials: 'include' }), fetch('/api/admin/intelligence/advisor-analytics', { credentials: 'include' }), fetch('/api/admin/intelligence/scarcity-heatmap', { credentials: 'include' })]);
          if (cpRes.ok) setIntelligenceClientProfiles(await cpRes.json());
          if (aaRes.ok) setIntelligenceAdvisorAnalytics(await aaRes.json());
          if (shRes.ok) setIntelligenceScarcityHeatmap(await shRes.json());
        }
        if (adminTab === 'legacy') {
          const lrRes = await fetch('/api/admin/legacy/requests', { credentials: 'include' });
          if (lrRes.ok) setAdminLegacyRequests(await lrRes.json());
        }
      }

      setListLoading(false);
    } catch (_) { setListLoading(false); }
  };

  useEffect(() => {
    if (user?.role === UserRole.ADMIN && (adminTab === 'intelligence' || adminTab === 'legacy')) {
      if (adminTab === 'intelligence') {
        Promise.all([
          fetch('/api/admin/intelligence/client-profiles', { credentials: 'include' }),
          fetch('/api/admin/intelligence/advisor-analytics', { credentials: 'include' }),
          fetch('/api/admin/intelligence/scarcity-heatmap', { credentials: 'include' })
        ]).then(([cpRes, aaRes, shRes]) => {
          if (cpRes.ok) cpRes.json().then(setIntelligenceClientProfiles);
          if (aaRes.ok) aaRes.json().then(setIntelligenceAdvisorAnalytics);
          if (shRes.ok) shRes.json().then(setIntelligenceScarcityHeatmap);
        });
      } else {
        fetch('/api/admin/legacy/requests', { credentials: 'include' }).then(r => r.ok && r.json().then(setAdminLegacyRequests));
      }
    }
  }, [user?.role, adminTab]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        if (user.role === UserRole.STRATEGIC_PRIVATE_ADVISOR) {
          try {
            const [dashRes, clientsRes, commissionsRes, contractsRes] = await Promise.all([
              fetch('/api/advisor/dashboard', { credentials: 'include' }),
              fetch('/api/advisor/clients', { credentials: 'include' }),
              fetch('/api/advisor/commissions', { credentials: 'include' }),
              fetch('/api/advisor/contracts', { credentials: 'include' })
            ]);
            const any403 = [dashRes, clientsRes, commissionsRes, contractsRes].some(r => r.status === 403);
            if (any403) setAdvisorNotActivated(true); else setAdvisorNotActivated(false);
            if (dashRes.ok) setAdvisorDashboard(await dashRes.json());
            if (clientsRes.ok) setAdvisorClients(await clientsRes.json());
            if (commissionsRes.ok) setAdvisorCommissions(await commissionsRes.json());
            if (contractsRes.ok) setAdvisorContracts(await contractsRes.json());
          } catch (_) {}
        }

        const apptsRes = await fetch(`/api/appointments?userId=${user.id}`);
        if (apptsRes.ok) setUserAppointments(await apptsRes.json());

        const recentViewsRes = await fetch('/api/recent-views', { credentials: 'include' });
        if (recentViewsRes.ok) {
          const recentPieces = await recentViewsRes.json();
          if (Array.isArray(recentPieces) && recentPieces.length > 0)
            setRecentlyViewedIds(recentPieces.map((p: { id: number }) => p.id));
        }

        const myBidsRes = await fetch(`/api/auctions/my-bids?userId=${user.id}`);
        if (myBidsRes.ok) setMyBids(await myBidsRes.json());

        if (user.role === UserRole.INVESTOR) {
          const [analyticsRes, myReqsRes, offersRes, portfolioRes] = await Promise.all([
            fetch('/api/investor/analytics'),
            fetch(`/api/investor/my-requests?userId=${user.id}`),
            fetch('/api/investor/fractional-offers'),
            fetch(`/api/investor/portfolio/${user.id}`)
          ]);
          if (analyticsRes.ok) setInvestorAnalytics(await analyticsRes.json());
          if (myReqsRes.ok) setInvestorRequests(await myReqsRes.json());
          if (offersRes.ok) setFractionalOffers(await offersRes.json());
          if (portfolioRes.ok) setInvestorPortfolio(await portfolioRes.json());
        }
        if (user.role === UserRole.CLIENT) {
          const offersRes = await fetch('/api/investor/fractional-offers');
          if (offersRes.ok) setFractionalOffers(await offersRes.json());
        }
        fetch('/api/atelier-moments').then(r => r.ok ? r.json() : []).then(setAtelierMoments).catch(() => {});
      } catch (e) {
        console.error("Fetch error", e);
      } finally {
        setListLoading(false);
      }
    })();
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) return;
    if (adminTab === 'intelligence') {
      Promise.all([
        fetch('/api/admin/intelligence/client-profiles', { credentials: 'include' }),
        fetch('/api/admin/intelligence/advisor-analytics', { credentials: 'include' }),
        fetch('/api/admin/intelligence/scarcity-heatmap', { credentials: 'include' })
      ]).then(([cp, aa, sh]) => {
        if (cp.ok) cp.json().then(setIntelligenceClientProfiles);
        if (aa.ok) aa.json().then(setIntelligenceAdvisorAnalytics);
        if (sh.ok) sh.json().then(setIntelligenceScarcityHeatmap);
      });
    }
    if (adminTab === 'legacy') {
      fetch('/api/admin/legacy/requests', { credentials: 'include' }).then(r => r.ok && r.json().then(setAdminLegacyRequests));
    }
  }, [user?.role, adminTab]);

  const handleInvestorRequestReview = async (requestId: number, approve: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/investor-requests/${requestId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const [updated, offers] = await Promise.all([
          fetch('/api/admin/investor-requests', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
          fetch('/api/admin/fractional-offers', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
        ]);
        setAdminInvestorRequests(updated);
        setAdminFractionalOffers(offers);
        notifyUser(approve ? "Anfrage genehmigt." : "Anfrage abgelehnt.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMeetingWithAppointment = (req: any) => {
    setAppointmentModalRequest(req);
    setAppointmentScheduleForm({ date: '', time: '09:00', title: '', notes: '' });
  };

  const handleScheduleAppointmentSubmit = async (payload: { date: string; time: string; title: string; notes: string }) => {
    if (!user || user.role !== UserRole.ADMIN || !appointmentModalRequest) return;
    const dateStr = payload.date && payload.date.includes('-') ? payload.date : payload.date.split('.').reverse().join('-');
    const scheduled_at = `${dateStr}T${(payload.time || '09:00').substring(0, 5)}:00`;
    setLoading(true);
    try {
      const reviewRes = await fetch(`/api/admin/investor-requests/${appointmentModalRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true }),
        credentials: 'include'
      });
      if (!reviewRes.ok) {
        notifyUser("Genehmigung fehlgeschlagen.", "error");
        return;
      }
      const apptRes = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          userId: appointmentModalRequest.user_id,
          requestId: appointmentModalRequest.id,
          scheduled_at,
          title: payload.title || (t('investor.schedule_meeting') as string),
          notes: payload.notes || null
        }),
        credentials: 'include'
      });
      if (apptRes.ok) {
        setAppointmentModalRequest(null);
        setAppointmentScheduleForm({ date: '', time: '09:00', title: '', notes: '' });
        const [invReq, appts] = await Promise.all([
          fetch('/api/admin/investor-requests', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
          fetch('/api/admin/appointments', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
        ]);
        setAdminInvestorRequests(invReq);
        setAdminAppointments(appts);
        notifyUser("Anfrage genehmigt und Termin eingetragen.", "success");
      } else {
        const err = await apptRes.json().catch(() => ({}));
        notifyUser(err?.error || "Termin konnte nicht erstellt werden.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointmentFromForm = async () => {
    if (!user || user.role !== UserRole.ADMIN) return;
    const { userId, date, time, title, notes } = newAppointmentForm;
    if (!userId || !date) { notifyUser("Bitte Kunde und Datum angeben.", "error"); return; }
    const dateStr = date.includes('-') ? date : date.split('.').reverse().join('-');
    const scheduled_at = `${dateStr}T${(time || '09:00').substring(0, 5)}:00`;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id, userId: Number(userId), scheduled_at, title: title || null, notes: notes || null }),
        credentials: 'include'
      });
      if (res.ok) {
        setNewAppointmentForm({ userId: '', date: '', time: '', title: '', notes: '' });
        const list = await fetch('/api/admin/appointments', { credentials: 'include' }).then(r => r.ok ? r.json() : []);
        setAdminAppointments(list);
        notifyUser("Termin erstellt.", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        notifyUser(err?.error || "Termin konnte nicht erstellt werden.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentRespond = async (appointmentId: number, status: 'confirmed' | 'cancelled') => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const list = await fetch(`/api/appointments?userId=${user.id}`, { credentials: 'include' }).then(r => r.ok ? r.json() : []);
        setUserAppointments(list);
        notifyUser(status === 'confirmed' ? "Termin angenommen." : "Termin abgesagt.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvestorRequest = async (type: 'allocation' | 'meeting' | 'preview' | 'dataroom' | 'share', message: string, masterpieceId?: number, percentage?: number) => {
    if (!user) return;
    if (type === 'share' && !masterpieceId) return;
    setLoading(true);
    try {
      const body: any = { userId: user.id, type, message };
      if (type === 'share') {
        body.masterpiece_id = masterpieceId;
        body.request_metadata = { percentage: percentage ?? shareRequestForm.percentage };
      }
      const res = await fetch('/api/investor/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notifyUser(t('investor.request_submitted'), 'success');
        if (type === 'share') setShareRequestForm({ masterpieceId: '', percentage: 5 });
        const myReqsRes = await fetch(`/api/investor/my-requests?userId=${user.id}`, { credentials: 'include' });
        if (myReqsRes.ok) setInvestorRequests(await myReqsRes.json());
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const logInvestorView = async (masterpieceId: number, interestLevel: number = 1) => {
    if (!user || user.role !== UserRole.INVESTOR) return;
    try {
      await fetch('/api/investor/log-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, masterpieceId, interestLevel })
      });
    } catch (e) {
      console.error("Log view error", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const emailTrim = (email || '').toString().trim();
    const passwordVal = (password || '').toString();
    if (!emailTrim || !passwordVal) {
      setLoginError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim, password: passwordVal }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUser(data);
        setLanguage(data.language);
        setView('dashboard');
      } else {
        const msg = (data && data.error) || t('errors.invalid_credentials');
        setLoginError(msg);
        notifyUser(msg, 'error');
      }
    } catch (err) {
      const msg = 'Verbindungsfehler. Ist der Server gestartet? (npm run dev)';
      setLoginError(msg);
      notifyUser(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, username: username.trim() || undefined, address, wantsVip, language, role: selectedRole })
      });
      if (res.ok) {
        notifyUser(t('auth.register_success'), 'success');
        setView('login');
      } else {
        const data = await res.json().catch(() => ({}));
        notifyUser(data?.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePiece = async () => {
    setLoading(true);
    try {
      const description_i18n = [newPiece.description, (newPiece as any).description_en, (newPiece as any).description_it].some(Boolean)
        ? { de: newPiece.description || undefined, en: (newPiece as any).description_en?.trim() || undefined, it: (newPiece as any).description_it?.trim() || undefined }
        : undefined;
      const materials_i18n = [newPiece.materials, (newPiece as any).materials_en, (newPiece as any).materials_it].some(Boolean)
        ? { de: newPiece.materials || undefined, en: (newPiece as any).materials_en?.trim() || undefined, it: (newPiece as any).materials_it?.trim() || undefined }
        : undefined;
      const gemstones_i18n = [newPiece.gemstones, (newPiece as any).gemstones_en, (newPiece as any).gemstones_it].some(Boolean)
        ? { de: newPiece.gemstones || undefined, en: (newPiece as any).gemstones_en?.trim() || undefined, it: (newPiece as any).gemstones_it?.trim() || undefined }
        : undefined;
      const res = await fetch('/api/admin/masterpieces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPiece.title,
          serial_id: newPiece.serial_id,
          category: newPiece.category,
          description: newPiece.description,
          materials: newPiece.materials,
          gemstones: newPiece.gemstones,
          description_i18n: description_i18n && Object.values(description_i18n).some(Boolean) ? description_i18n : undefined,
          materials_i18n: materials_i18n && Object.values(materials_i18n).some(Boolean) ? materials_i18n : undefined,
          gemstones_i18n: gemstones_i18n && Object.values(gemstones_i18n).some(Boolean) ? gemstones_i18n : undefined,
          valuation: parseFloat(newPiece.valuation) || 0,
          rarity: newPiece.rarity,
          production_time: newPiece.production_time,
          cert_data: newPiece.cert_data,
          deposit_pct: parseFloat(newPiece.deposit_pct) || 50,
          image_url: (newPiece.images?.length ? newPiece.images[0] : newPiece.image) || '',
          image_urls: (newPiece.images?.length ? newPiece.images : undefined),
          pricing_mode: (newPiece as any).pricing_mode ?? 'fixed'
        })
      });
      if (res.ok) {
        notifyUser(t('admin.piece_created'), 'success');
        setNewPiece({ 
          title: '', 
          serial_id: '', 
          category: 'Jewelry',
          description: '', 
          materials: '', 
          gemstones: '', 
          description_en: '', description_it: '',
          materials_en: '', materials_it: '',
          gemstones_en: '', gemstones_it: '',
          valuation: '', 
          rarity: 'Unique', 
          production_time: '4-6 Weeks',
          cert_data: '',
          deposit_pct: '50', 
          image: '',
          images: [],
          pricing_mode: 'fixed'
        });
        fetchData();
      } else {
        try {
          const err = await res.json();
          notifyUser(err.error || t('errors.piece_create_failed'), 'error');
        } catch {
          notifyUser(t('errors.piece_create_failed'), 'error');
        }
      }
    } catch (_err) {
      notifyUser(t('errors.piece_create_failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAuction,
          masterpieceId: parseInt(newAuction.masterpieceId),
          startPrice: parseFloat(newAuction.startPrice)
        })
      });
      if (res.ok) {
        notifyUser(t('admin.auction_created'), 'success');
        setNewAuction({ masterpieceId: '', startPrice: '', endTime: '', vipOnly: false });
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPiece = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/assign-piece', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(assignPiece.userId),
          masterpieceId: parseInt(assignPiece.masterpieceId)
        })
      });
      if (res.ok) {
        notifyUser(t('admin.piece_assigned'), 'success');
        setAssignPiece({ userId: '', masterpieceId: '' });
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (pieceId: number, delivery_option?: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, masterpieceId: pieceId, delivery_option: delivery_option || null }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notifyUser(t('marketplace.request_sent'), 'success');
        fetchData();
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePurchase = async (pieceId: number, approve: boolean, adminId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approve-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterpieceId: pieceId, approve, adminId }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchData();
        notifyUser(approve ? "Kauf genehmigt." : "Kauf abgelehnt.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkflow = async (pieceId: number, step: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workflow/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterpieceId: pieceId, step, adminId: user.id }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchData();
        notifyUser("Workflow-Schritt aktualisiert.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const addPdfFooter = (doc: any, pageWidth: number, pageHeight: number, margin: number) => {
    const footerY = pageHeight - 18;
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.15);
    doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(COMPANY_INFO.name, margin, footerY);
    doc.text(COMPANY_INFO.address, margin, footerY + 4);
    doc.text(`USt-IdNr.: ${COMPANY_INFO.vatId}  |  Steuernummer: ${COMPANY_INFO.steuernummer}`, margin, footerY + 8);
  };

  const downloadPDF = async (title: string, content: string, piece?: Masterpiece, options?: { docRef?: string; fileName?: string; contractType?: string }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 24;

    const typ = (options?.contractType || '').toLowerCase();
    const showProductImage = piece?.image_url && (typ === 'deposit' || typ === 'invoice' || typ === 'certificate' || title.toLowerCase().includes('certificat'));
    let productImgData: string | null = null;
    if (showProductImage && piece!.image_url) {
      productImgData = await loadImageAsDataUrl(piece!.image_url);
    }

    // Hochwertiger Hintergrund
    doc.setFillColor(253, 252, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFontSize(38);
    doc.setTextColor(250, 249, 247);
    doc.setFont("times", "italic");
    doc.text("ANTONIO BELLANOVA", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });

    doc.setFontSize(5);
    doc.setTextColor(242, 242, 242);
    doc.setFont("helvetica", "normal");
    doc.text("PRIVATE VAULT · KÖLN", 12, pageHeight / 2, { angle: 90 });
    doc.text("JUWELEN & SCHMUCKATELIER", pageWidth - 12, pageHeight / 2, { angle: -90 });

    // Header – klar und lesbar
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 140, 60);
    doc.text("JUWELEN & SCHMUCKATELIER ANTONIO BELLANOVA", pageWidth / 2, 22, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(COMPANY_INFO.address, pageWidth / 2, 28, { align: "center" });
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.3);
    doc.line(margin, 32, pageWidth - margin, 32);
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), pageWidth / 2, 42, { align: "center" });
    doc.setDrawColor(230, 230, 228);
    doc.setLineWidth(0.15);
    doc.line(margin, 46, pageWidth - margin, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text("DOK.-REF.", margin, 52);
    doc.text("KUNDENREF.", margin + 32, 52);
    doc.text("DATUM", margin + 62, 52);
    doc.text("SEITE", pageWidth - margin - 18, 52);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    const docRef = options?.docRef || `REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    doc.text(docRef, margin, 56);
    doc.text(`CL-${user?.id ?? '—'}`, margin + 32, 56);
    doc.text(new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }), margin + 62, 56);

    let currentY = 64;

    // Produktbild (für Anzahlung, Kaufvertrag, Echtheitszertifikat)
    const imgSize = 38;
    const imgX = pageWidth - margin - imgSize;
    if (productImgData && piece) {
      try {
        doc.addImage(productImgData, 'JPEG', imgX, currentY, imgSize, imgSize);
        doc.setDrawColor(220, 210, 195);
        doc.setLineWidth(0.2);
        doc.rect(imgX, currentY, imgSize, imgSize, 'D');
      } catch (_) {}
    }

    // Asset-Block (mit oder ohne Bild daneben)
    if (piece && (piece.title || piece.serial_id)) {
      const textWidth = productImgData ? imgX - margin - 8 : pageWidth - 2 * margin;
      const displayTitle = (piece.title && piece.title.length > 1) ? piece.title : (piece.serial_id ? `Serial ${piece.serial_id}` : 'Meisterstück');
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text(displayTitle, margin, currentY + 6, { maxWidth: textWidth });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(`Seriennummer: ${piece.serial_id || '—'}`, margin, currentY + 12);
      const blockH = 28;
      currentY += 18;
      doc.setFillColor(252, 251, 249);
      doc.rect(margin, currentY, textWidth, blockH, 'F');
      doc.setDrawColor(235, 228, 218);
      doc.rect(margin, currentY, textWidth, blockH, 'D');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(180, 140, 60);
      doc.text("SPEZIFIKATION", margin + 4, currentY + 7);
      doc.text("BEWERTUNG", margin + textWidth / 2 + 4, currentY + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text((piece.materials && piece.materials.length > 1) ? piece.materials : '—', margin + 4, currentY + 14);
      doc.text((piece.gemstones && piece.gemstones.length > 1) ? piece.gemstones : '—', margin + 4, currentY + 20);
      const val = piece.valuation != null && Number(piece.valuation) > 0 ? Number(piece.valuation).toLocaleString('de-DE') + ' EUR' : '—';
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.text(val, margin + textWidth / 2 + 4, currentY + 16);
      currentY += blockH + 10;
    }

    // Body: use tidy generated text when we have piece + contractType, else stripped HTML (language-aware for contracts)
    let bodyText: string;
    if (piece && typ) {
      const serial = piece.serial_id || '—';
      const valuation = piece.valuation != null && Number(piece.valuation) > 0 ? `${Number(piece.valuation).toLocaleString('de-DE')} EUR` : '—';
      const pct = piece.deposit_pct ?? 10;
      const depositAmount = piece.valuation != null ? ((piece.valuation * pct) / 100).toLocaleString('de-DE') : '—';
      const titlePiece = (piece.title && piece.title.length > 1) ? piece.title : serial;
      const lang = (language || 'de').toLowerCase().slice(0, 2);
      const companyBlock = `${COMPANY_INFO.name}\n${COMPANY_INFO.address}\nUSt-IdNr.: ${COMPANY_INFO.vatId}\nSteuernummer: ${COMPANY_INFO.steuernummer}`;
      if (typ === 'deposit') {
        if (lang === 'de') bodyText = `ANZAHLUNGSVERTRAG\n\nDieser Vertrag bestätigt die formale Reservierung des Meisterstücks „${titlePiece}" (Seriennummer: ${serial}).\n\nGesamtbewertung: ${valuation}. Eine nicht erstattungsfähige Anzahlung in Höhe von ${depositAmount} EUR (${pct} % des Gesamtbetrags) ist zur Einleitung der Fertigung erforderlich. Das Objekt bleibt im Antonio Bellanova Vault verwahrt. Das Eigentum verbleibt beim Atelier bis zur vollständigen Bezahlung und Übertragung.\n\nMit der Unterzeichnung erkennt der Kunde die Bedingungen an und verpflichtet sich zur Anzahlung. Anwendbares Recht: Deutschland. Gerichtsstand: Köln.\n\n${companyBlock}`;
        else if (lang === 'fr') bodyText = `CONTRAT D'ACOMPTE\n\nLe présent contrat confirme la réservation formelle du Chef-d'œuvre « ${titlePiece} » (Numéro de série : ${serial}).\n\nÉvaluation totale : ${valuation}. Un acompte non remboursable de ${depositAmount} EUR (${pct} % du montant total) est requis pour lancer la fabrication. L'objet reste déposé au Antonio Bellanova Vault. La propriété reste à l'Atelier jusqu'au paiement intégral et au transfert.\n\nEn signant, le client accepte les conditions et s'engage à verser l'acompte. Droit applicable : Allemagne. Juridiction : Cologne.\n\n${companyBlock}`;
        else if (lang === 'it') bodyText = `CONTRATTO DI ACCONTO\n\nIl presente contratto conferma la prenotazione formale del Capolavoro «${titlePiece}» (Numero di serie: ${serial}).\n\nValutazione totale: ${valuation}. Un acconto non rimborsabile di ${depositAmount} EUR (${pct}% del totale) è richiesto per avviare la realizzazione. L'oggetto resta custodito presso Antonio Bellanova Vault. La proprietà resta all'Atelier fino al pagamento completo e al trasferimento.\n\nCon la firma il cliente accetta le condizioni e si impegna a versare l'acconto. Legge applicabile: Germania. Foro: Colonia.\n\n${companyBlock}`;
        else bodyText = `This Deposit Agreement confirms the formal reservation of the Masterpiece "${titlePiece}" (Serial: ${serial}).\n\nTotal valuation: ${valuation}. A non-refundable deposit of ${depositAmount} EUR (${pct}% of total) is required. Governing law: Germany. Jurisdiction: Cologne.`;
      } else if (typ === 'invoice') {
        if (lang === 'de') bodyText = `KAUFVERTRAG / SCHLUSSRECHNUNG\n\nSchlussrechnung für das Meisterstück „${titlePiece}" (Seriennummer: ${serial}).\n\nGesamtbewertung: ${valuation}. Der Restbetrag ist gemäß den Zahlungsanweisungen fällig. Nach vollständiger Zahlung und Bestätigung wird das Eigentum übertragen und ein Echtheitszertifikat ausgestellt.\n\nAnwendbares Recht: Deutschland. Gerichtsstand: Köln.\n\n${companyBlock}`;
        else if (lang === 'fr') bodyText = `CONTRAT DE VENTE / FACTURE FINALE\n\nFacture finale pour le Chef-d'œuvre « ${titlePiece} » (N° série : ${serial}).\n\nÉvaluation totale : ${valuation}. Le solde est dû selon les instructions de paiement. Après paiement intégral et confirmation, la propriété sera transférée et un certificat d'authenticité sera délivré.\n\nDroit applicable : Allemagne. Juridiction : Cologne.\n\n${companyBlock}`;
        else if (lang === 'it') bodyText = `CONTRATTO DI VENDITA / FATTURA FINALE\n\nFattura finale per il Capolavoro «${titlePiece}» (N. serie: ${serial}).\n\nValutazione totale: ${valuation}. Il saldo è dovuto secondo le istruzioni di pagamento. Dopo il pagamento completo e la conferma, la proprietà sarà trasferita e sarà rilasciato un certificato di autenticità.\n\nLegge applicabile: Germania. Foro: Colonia.\n\n${companyBlock}`;
        else bodyText = `Final Invoice for the Masterpiece "${titlePiece}" (Serial: ${serial}).\n\nTotal valuation: ${valuation}. Upon full payment, ownership will be transferred and a Certificate of Authenticity will be issued. Governing law: Germany. Jurisdiction: Cologne.`;
      } else if (typ === 'resale_commission' || typ === 'resale') {
        if (lang === 'de') bodyText = `Wiederverkaufs- und Provisionsvereinbarung für das Objekt „${titlePiece}" (Seriennummer: ${serial}).\n\nBewertung: ${valuation}. Diese Vereinbarung regelt den Weiterverkauf über die Antonio Bellanova Vault Plattform. Provisions- und Auszahlungsbedingungen gemäß unterzeichneter Vereinbarung. Plattform-Wiederverkauf gewährleistet Registry-Aktualisierung, neues Zertifikat und Garantiefortbestand.\n\nAnwendbares Recht: Deutschland. Gerichtsstand: Köln.`;
        else if (lang === 'fr') bodyText = `Accord de commission de revente pour l'actif « ${titlePiece} » (N° série : ${serial}).\n\nÉvaluation : ${valuation}. Cet accord régit la vente sur le marché secondaire via la plateforme Antonio Bellanova Vault. Commission et conditions de paiement selon l'accord signé. Droit applicable : Allemagne. Juridiction : Cologne.`;
        else if (lang === 'it') bodyText = `Accordo di commissione di rivendita per l'asset «${titlePiece}» (N. serie: ${serial}).\n\nValutazione: ${valuation}. Il presente accordo regola la vendita sul mercato secondario tramite la piattaforma Antonio Bellanova Vault. Legge applicabile: Germania. Foro: Colonia.`;
        else bodyText = `Resale Commission Agreement for the asset "${titlePiece}" (Serial: ${serial}).\n\nValuation: ${valuation}. This agreement governs the secondary market sale of the asset through the Antonio Bellanova Vault platform. Commission and payout terms apply as per the signed agreement. Platform resale ensures Registry update, new Certificate, and warranty continuity.\n\nGoverning law: Germany. Jurisdiction: Cologne.`;
      } else if (typ === 'vip') {
        if (lang === 'de') bodyText = `VIP-Mitgliedschaftsvereinbarung. Jährliche Vorteile: 48h Vorzugszugang, Private Auktionen, Concierge-Service, Reparatur-Priorität, reduzierte Wiederverkaufsprovision, Einladungs-Events. Kündigung gemäß Plattformbedingungen. Anwendbares Recht: Deutschland. Gerichtsstand: Köln.`;
        else if (lang === 'fr') bodyText = `Accord d'adhésion VIP. Avantages annuels : accès anticipé 48h, ventes aux enchères privées, service concierge, priorité réparation, commission de revente réduite, événements sur invitation. Droit applicable : Allemagne. Juridiction : Cologne.`;
        else if (lang === 'it') bodyText = `Accordo di membership VIP. Vantaggi annuali: accesso anticipato 48h, aste private, servizio concierge, priorità riparazioni, commissione di rivendita ridotta. Legge applicabile: Germania. Foro: Colonia.`;
        else bodyText = `VIP Membership Agreement. Annual membership benefits: 48h Early Access, Private Auction Access, Concierge Service, repair priority, reduced resale commission, invite-only events. Terms and cancellation as per Platform Terms.\n\nGoverning law: Germany. Jurisdiction: Cologne.`;
      } else if (typ === 'fractional') {
        if (lang === 'de') bodyText = `Anteilsvereinbarung zur Beteiligung am Objekt „${titlePiece}" (Seriennummer: ${serial}).\n\nBewertung: ${valuation}. Das physische Objekt bleibt im Antonio Bellanova Vault verwahrt. Ausstieg und Sekundärhandel gemäß Plattformregeln. Anwendbares Recht: Deutschland. Gerichtsstand: Köln.`;
        else if (lang === 'fr') bodyText = `Accord de propriété fractionnée pour la participation à l'actif « ${titlePiece} » (N° série : ${serial}).\n\nÉvaluation : ${valuation}. L'actif physique reste en dépôt au Antonio Bellanova Vault. Sortie et négociation secondaire selon les règles de la plateforme. Droit applicable : Allemagne. Juridiction : Cologne.`;
        else if (lang === 'it') bodyText = `Accordo di proprietà frazionata per la partecipazione all'asset «${titlePiece}» (N. serie: ${serial}).\n\nValutazione: ${valuation}. L'asset fisico resta in custodia presso Antonio Bellanova Vault. Uscita e trading secondario secondo le regole della piattaforma. Legge applicabile: Germania. Foro: Colonia.`;
        else bodyText = `Fractional Ownership Agreement for participation in the asset "${titlePiece}" (Serial: ${serial}).\n\nValuation: ${valuation}. The physical asset remains in the custody of the Antonio Bellanova Vault. Exit and secondary trading as per platform rules.\n\nGoverning law: Germany. Jurisdiction: Cologne.`;
      } else {
        bodyText = title + '. This document forms part of your contractual relationship with Antonio Bellanova Atelier. Governing law: Germany. Jurisdiction: Cologne.';
      }
    } else {
      let cleanContent = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<\/?(div|p|h[1-6]|li|tr|section)[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/(\d+)\.\s*/g, '\n$1. ')
      .trim();
      if (!cleanContent || cleanContent.length < 15) cleanContent = title + '. Document on file. Governing law: Germany. Jurisdiction: Cologne.';
      bodyText = cleanContent;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(25, 25, 25);
    const lineHeight = 5.2;
    const footerHeight = 22;
    const sigY = pageHeight - footerHeight - 36;
    const maxBodyY = sigY - 12;
    // PDF-safe: replace Unicode quotes and non-breaking space so jsPDF doesn't throw
    const safeBodyText = String(bodyText || '')
      .replace(/\u2018|\u2019/g, "'").replace(/\u201C|\u201D|\u201E/g, '"')
      .replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n').trim() || title;
    const splitText = doc.splitTextToSize(safeBodyText, pageWidth - 2 * margin - 4);
    let page = 1;
    for (let i = 0; i < splitText.length; i++) {
      if (currentY + lineHeight > maxBodyY && page === 1) {
        addPdfFooter(doc, pageWidth, pageHeight, margin);
        doc.setPage(1);
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text("1", pageWidth - margin - 12, 56);
        doc.addPage();
        page++;
        doc.setFillColor(253, 252, 250);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        currentY = margin;
      } else if (currentY + lineHeight > pageHeight - margin - footerHeight && page > 1) {
        addPdfFooter(doc, pageWidth, pageHeight, margin);
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text(String(page), pageWidth - margin - 12, pageHeight - 10);
        doc.addPage();
        page++;
        doc.setFillColor(253, 252, 250);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        currentY = margin;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(25, 25, 25);
      doc.text(splitText[i], margin, currentY, { align: "justify" });
      currentY += lineHeight;
    }

    const signAtY = page > 1 ? currentY + 14 : sigY;
    if (page > 1) doc.setPage(page);
    addPdfFooter(doc, pageWidth, pageHeight, margin);
    const totalPages = page;
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.text(`${p} / ${totalPages}`, pageWidth - margin - 12, pageHeight - 10);
    }
    doc.setPage(page);
    doc.setDrawColor(230, 228, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, signAtY - 12, pageWidth - margin, signAtY - 12);
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text("Antonio Bellanova", margin, signAtY);
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.25);
    doc.line(margin, signAtY + 2, margin + 50, signAtY + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(110, 110, 110);
    doc.text("ATELIER · VERANTWORTLICH", margin, signAtY + 7);
    doc.line(pageWidth - margin - 50, signAtY + 2, pageWidth - margin, signAtY + 2);
    doc.text("KUNDENUNTERSCHRIFT", pageWidth - margin - 50, signAtY + 7);

    const fileName = options?.fileName || `${title.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleBid = async (auctionId: number, amount: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auctions/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId, userId: user.id, amount }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
      fetchData();
        notifyUser("Gebot abgegeben.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchData();
        notifyUser("Zahlung bestätigt.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clients/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        const data = await res.json();
        notifyUser(t('admin.client_added'), 'success');
        setNewClient({ name: '', email: '', address: '', role: 'client', isVip: false });
        fetchData();
      } else {
        const err = await res.json();
        notifyUser(err.error || "Failed to add client", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: number, approve: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approve })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const [showCeremony, setShowCeremony] = useState<Masterpiece | null>(null);

  const handleSignContract = async (contractId: number, method: string, data: string) => {
    setContractSignError(null);
    if (!data || (method === 'drawn' && data.length < 100) || (method === 'typed' && data.trim().length < 2)) {
      setContractSignError("Bitte prüfen Sie die Checkbox und geben Sie eine gültige Signatur ein.");
      notifyUser("Bitte prüfen Sie die Checkbox und geben Sie eine gültige Signatur ein.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, method, data }),
        credentials: 'include'
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setContractSignError(null);
        fetchData();
        setContractToSign(null);
        notifyUser("Vertrag angenommen und unterzeichnet.", "success");
        setShowSuccessOverlay({ message: "Vertrag unterzeichnet" });
        setTimeout(() => setShowSuccessOverlay(null), 2200);
        if (result.masterpieceId) {
          const piece = masterpieces.find(m => m.id === result.masterpieceId);
          if (piece) setShowCeremony(piece);
        }
      } else {
        const msg = result.error || (res.status === 401 ? "Bitte erneut anmelden." : res.status === 403 ? "Sie sind nicht berechtigt, diesen Vertrag zu unterzeichnen." : "Unterzeichnung fehlgeschlagen.");
        setContractSignError(msg);
        notifyUser(msg, "error");
      }
    } catch (err) {
      const msg = "Unterzeichnung fehlgeschlagen. Bitte prüfen Sie die Verbindung.";
      setContractSignError(msg);
      notifyUser(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleListResale = async (masterpieceId: number) => {
    if (!user) return;
    let suggestedPrice = '';
    try {
      const sug = await fetch(`/api/masterpieces/${masterpieceId}/resale-suggestion`).then(r => r.ok ? r.json() : null);
      if (sug?.price_recommendation) suggestedPrice = ` (Empfehlung: ${Number(sug.price_recommendation).toLocaleString('de-DE')} €)`;
    } catch (_) {}
    const price = prompt(t('admin.resale_price') + ' (€):' + suggestedPrice);
    if (!price || isNaN(parseFloat(price))) return;
    const askingPrice = parseFloat(price);
    if (askingPrice <= 0) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/resale/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, masterpieceId, askingPrice, saleMethod: 'marketplace' }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.contractId && data.contract) {
        setContractToSign({
          id: data.contractId,
          user_id: user.id,
          masterpiece_id: masterpieceId,
          type: 'resale',
          doc_ref: data.contract.doc_ref || '',
          content: data.contract.content || '',
          signed_at: null,
          status: 'draft',
          version: 1,
          parent_id: null,
          created_at: ''
        });
      } else if (res.ok) {
        notifyUser(t('resale.request_submitted'), 'success');
      fetchData();
      } else {
        const msg = data.error || (res.status === 403 ? 'Nur der Eigentümer kann dieses Stück zum Wiederverkauf anbieten.' : res.status === 401 ? 'Bitte erneut anmelden.' : 'Wiederverkauf konnte nicht gestartet werden.');
        notifyUser(msg, 'error');
      }
    } catch (e) {
      notifyUser('Verbindungsfehler. Bitte prüfen Sie die Internetverbindung.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const visiblePortfolioPieces = vaultData.pieces.filter((p: Masterpiece) => !(vaultData.portfolio_hidden_ids || []).includes(p.id));
  const hiddenPortfolioPieces = vaultData.pieces.filter((p: Masterpiece) => (vaultData.portfolio_hidden_ids || []).includes(p.id));

  const handleRemoveFromPortfolio = async (masterpieceId: number) => {
    try {
      const res = await fetch('/api/portfolio/hide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ masterpieceId }), credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setVaultData(prev => ({ ...prev, portfolio_hidden_ids: [...(prev.portfolio_hidden_ids || []), masterpieceId] }));
        notifyUser('Stück aus der Portfolio-Anzeige entfernt.', 'success');
      } else {
        const msg = res.status === 403 ? (data.error || 'Nur das eigene Stück kann ausgeblendet werden.') : (data.error || 'Fehler beim Entfernen.');
        notifyUser(msg, 'error');
      }
    } catch {
      notifyUser('Fehler beim Entfernen.', 'error');
    }
  };

  const handleUnhideFromPortfolio = async (masterpieceId: number) => {
    try {
      const res = await fetch('/api/portfolio/unhide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ masterpieceId }), credentials: 'include' });
      if (res.ok) {
        setVaultData(prev => ({ ...prev, portfolio_hidden_ids: (prev.portfolio_hidden_ids || []).filter(id => id !== masterpieceId) }));
        notifyUser('Stück wieder in der Portfolio-Anzeige.', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        notifyUser(data.error || 'Fehler.', 'error');
      }
    } catch {
      notifyUser('Fehler.', 'error');
    }
  };

  const handleDeleteMasterpiece = async () => {
    if (!deletePieceConfirm?.piece) return;
    const { piece, password } = deletePieceConfirm;
    if (!password.trim()) {
      setDeletePieceConfirm(prev => prev ? { ...prev, error: 'Bitte Admin-Passwort eingeben.' } : null);
      return;
    }
    setLoading(true);
    setDeletePieceConfirm(prev => prev ? { ...prev, error: '' } : null);
    try {
      const res = await fetch(`/api/admin/masterpieces/${piece.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMasterpieces(prev => prev.filter(p => p.id !== piece.id));
        setSelectedPiece(null);
        setDeletePieceConfirm(null);
        notifyUser(data.message || 'Stück wurde dauerhaft aus dem System entfernt.', 'success');
      } else {
        setDeletePieceConfirm(prev => prev ? { ...prev, error: data.error || 'Löschen fehlgeschlagen.' } : null);
      }
    } catch {
      setDeletePieceConfirm(prev => prev ? { ...prev, error: 'Netzwerkfehler.' } : null);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveResale = async (masterpieceId: number, approve: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approve-resale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterpieceId, approve })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectResaleListing = async (resaleListingId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resale/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resaleListingId, adminId: user.id })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustResaleListing = async (resaleListingId: number) => {
    if (!user) return;
    const commissionPct = prompt(t('admin.commission_pct') + ' (%)', '8');
    if (commissionPct == null) return;
    const cp = parseFloat(commissionPct);
    const minPrice = prompt(t('admin.min_price') + ' (€, optional)', '');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resale/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resaleListingId,
          adminId: user.id,
          commissionPct: isNaN(cp) ? undefined : cp,
          minPrice: minPrice !== '' && !isNaN(parseFloat(minPrice)) ? parseFloat(minPrice) : undefined
        })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritizeAuctionResale = async (resaleListingId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resale/prioritize-auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resaleListingId, adminId: user.id })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleResaleDecision = async (resaleListingId: number, decision: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resale/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resaleListingId, adminId: user.id, decision }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchData();
        notifyUser("Entscheidung gespeichert.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkExternal = async (masterpieceId: number) => {
    if (!user) return;
    if (!confirm(t('resale.mark_external') + ' — ' + (t('resale.warranty_void') + '?'))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/masterpieces/${masterpieceId}/mark-external`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchData();
        notifyUser("Als extern übertragen markiert.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendBuybackOffer = async (resaleListingId: number) => {
    if (!user) return;
    const raw = prompt(t('admin.send_buyback_offer') + ' — ' + t('admin.resale_price') + ' (€) oder % unter Bewertung (z.B. 10)');
    if (raw == null || raw.trim() === '') return;
    const trimmed = raw.trim();
    const asPct = trimmed.endsWith('%') ? parseFloat(trimmed.slice(0, -1)) : (parseFloat(trimmed) <= 100 && parseFloat(trimmed) >= 0 ? parseFloat(trimmed) : null);
    const body: { resaleListingId: number; adminId: number; offeredAmount?: number; valuation_pct_below?: number } = { resaleListingId, adminId: user.id };
    if (asPct != null && !isNaN(asPct) && asPct >= 0 && asPct <= 100) body.valuation_pct_below = asPct;
    else { const amt = parseFloat(trimmed); if (!isNaN(amt)) body.offeredAmount = amt; else return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resale/buyback-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchData();
        notifyUser("Rückkaufangebot gesendet.", "success");
      } else {
        notifyUser(data.error || t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConcierge = async (message: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/vip/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message })
      });
      if (res.ok) {
        const data = await res.json();
        notifyUser(data.response ?? 'Gesendet.', 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const masterpieceFileInputRef = useRef<HTMLInputElement>(null);
  const [draggingOverImages, setDraggingOverImages] = useState(false);
  const processImageFiles = (files: File[]) => {
    if (!files?.length) return;
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!list.length) return;
    const results: string[] = new Array(list.length);
    let done = 0;
    const maxSize = 1200;
    const compress = (dataUrl: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w > h) { h = (h / w) * maxSize; w = maxSize; } else { w = (w / h) * maxSize; h = maxSize; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(dataUrl); return; }
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } catch {
            resolve(dataUrl);
          }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      });
    };
    list.forEach((file, i) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        if (!dataUrl || typeof dataUrl !== 'string') { done += 1; if (done === list.length) finish(); return; }
        const compressed = await compress(dataUrl);
        results[i] = compressed;
        done += 1;
        if (done === list.length) finish();
      };
      reader.readAsDataURL(file);
    });
    const finish = () => {
      const newImages = results.filter(Boolean);
      setNewPiece(prev => {
        const combined = [...(prev.images || []), ...newImages];
        return { ...prev, images: combined, image: combined[0] || prev.image };
      });
    };
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) processImageFiles(Array.from(files));
    e.target.value = '';
  };

  if (view === 'verify') {
    return (
      <div className={`min-h-screen font-sans ${theme === 'light' ? 'bg-zinc-100 text-zinc-900' : 'bg-[#050505] text-zinc-100'} flex flex-col items-center justify-center p-6`}>
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-serif italic">Zertifikat prüfen</h1>
          {verifyData ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-left space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold uppercase tracking-widest text-xs">Verifiziert · Antonio Bellanova</span>
              </div>
              <p className="text-zinc-400 text-sm">Dieses Zertifikat ist gültig und dem Atelier zugeordnet.</p>
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <p><span className="text-zinc-500 text-xs uppercase">Stück</span><br /><span className="text-zinc-200">{verifyData.piece?.title ?? '—'}</span></p>
                <p><span className="text-zinc-500 text-xs uppercase">Seriennummer</span><br /><span className="font-mono text-zinc-300">{verifyData.piece?.serial_id ?? '—'}</span></p>
                <p><span className="text-zinc-500 text-xs uppercase">Registriert auf</span><br /><span className="text-zinc-300">{verifyData.owner_name ?? '—'}</span></p>
                {verifyData.cert?.blockchain_hash && <p><span className="text-zinc-500 text-xs uppercase">Blockchain</span><br /><span className="font-mono text-[10px] text-zinc-500 break-all">{verifyData.cert.blockchain_hash}</span></p>}
              </div>
            </div>
          ) : verifyCertId && verifyData === null ? (
            <p className="text-zinc-500">Lade …</p>
          ) : verifyCertId ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
              <p className="text-amber-500/90">Zertifikat nicht gefunden oder ungültig.</p>
              <p className="text-zinc-500 text-xs mt-2">Prüfen Sie die URL oder wenden Sie sich an das Atelier.</p>
            </div>
          ) : null}
          <button type="button" onClick={() => { setView('login'); setVerifyCertId(null); setVerifyData(null); }} className="text-xs uppercase tracking-widest text-amber-500 hover:text-amber-400">← {t('common.back_home')}</button>
        </div>
      </div>
    );
  }

  const legalAndContactViews = ['impressum', 'datenschutz', 'agb', 'kontakt', 'anfahrt'] as const;
  if (legalAndContactViews.includes(view as any)) {
    const isLegal = view === 'impressum' || view === 'datenschutz' || view === 'agb';
    const titles: Record<string, string> = { impressum: t('legal.imprint'), datenschutz: t('legal.privacy'), agb: t('legal.terms'), kontakt: t('legal.contact'), anfahrt: t('legal.directions') };
    return (
      <div className={`min-h-screen font-sans ${theme === 'light' ? 'bg-zinc-100 text-zinc-900' : 'bg-[#050505] text-zinc-100'} flex flex-col`}>
        <div className="p-6 max-w-3xl mx-auto w-full flex-1">
          <button type="button" onClick={() => setView(user ? 'dashboard' : 'login')} className="text-xs uppercase tracking-widest text-amber-500 hover:text-amber-400 mb-8">← {user ? t('common.back_dashboard') : t('common.back_home')}</button>
          <h1 className="text-2xl font-serif italic mb-6">{titles[view]}</h1>
          {view === 'impressum' && (
            <div className="prose prose-invert max-w-none text-sm space-y-4">
              <p><strong>Angaben gemäß § 5 TMG</strong></p>
              <p>{COMPANY_INFO.name}<br />{COMPANY_INFO.address}</p>
              <p><strong>Kontakt</strong><br />E-Mail: antonio.bellanova@antoniobellanova.com</p>
              <p><strong>Umsatzsteuer-ID</strong><br />Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: {COMPANY_INFO.vatId}</p>
              <p><strong>Verantwortlich für den Inhalt</strong><br />{COMPANY_INFO.owner}, {COMPANY_INFO.address}</p>
              <p><strong>Haftungsausschluss</strong><br />Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
            </div>
          )}
          {view === 'datenschutz' && (
            <div className="prose prose-invert max-w-none text-sm space-y-4">
              <p><strong>Datenschutzerklärung</strong></p>
              <p>Verantwortlicher: {COMPANY_INFO.name}, {COMPANY_INFO.address}.</p>
              <p>Wir erheben und verarbeiten personenbezogene Daten nur im Rahmen der gesetzlichen Vorgaben (DSGVO, BDSG). Daten werden zur Vertragserfüllung, Kundenkommunikation und zur Bereitstellung des Portals genutzt. Eine Weitergabe an Dritte erfolgt nur bei gesetzlicher Verpflichtung oder mit Ihrer Einwilligung.</p>
              <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung sowie auf Datenübertragbarkeit. Beschwerden können Sie bei einer Aufsichtsbehörde geltend machen.</p>
              <p>Kontakt für Datenschutzanfragen: antonio.bellanova@antoniobellanova.com</p>
            </div>
          )}
          {view === 'agb' && (
            <div className="prose prose-invert max-w-none text-sm space-y-4">
              <p><strong>Allgemeine Geschäftsbedingungen</strong></p>
              <p>Geltungsbereich: Diese AGB gelten für alle Geschäfte zwischen {COMPANY_INFO.name} und dem Kunden.</p>
              <p>Vertragsschluss: Durch Bestellung bzw. Unterzeichnung von Verträgen kommt ein verbindlicher Kauf- oder Dienstvertrag zustande. Preise verstehen sich in Euro inkl. gesetzlicher MwSt., sofern nicht anders angegeben.</p>
              <p>Zahlung: Die Zahlungsmodalitäten ergeben sich aus dem jeweiligen Vertrag (Anzahlung, Restzahlung, Raten). Bei Verzug können Verzugszinsen geltend gemacht werden.</p>
              <p>Eigentumsvorbehalt: Bis zur vollständigen Bezahlung bleibt die Ware Eigentum des Ateliers.</p>
              <p>Gerichtsstand und anwendbares Recht: Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Köln, sofern der Kunde Kaufmann ist.</p>
            </div>
          )}
          {view === 'kontakt' && (
            <div className="space-y-6">
              <p className="text-zinc-400">{COMPANY_INFO.name}, {COMPANY_INFO.address}</p>
              <p className="text-sm text-zinc-500">{t('contact.intro')}</p>
              {user && (
                <Button variant="primary" className="text-sm" onClick={() => setView('concierge')}>{t('contact.goto_concierge')}</Button>
              )}
              {!contactFormSent ? (
                <form className="grid gap-4 max-w-md" onSubmit={async (e) => {
                  e.preventDefault();
                  setContactFormSubmitting(true);
                  try {
                    const res = await fetch('/api/contact', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contactForm),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.success) {
                      setContactFormSent(true);
                      setContactForm({ name: '', email: '', subject: '', message: '' });
                      if (data.emailSent) notifyUser(t('contact.success_sent') || 'Nachricht gesendet.', 'success');
                    } else {
                      notifyUser(data.error || t('contact.error_send'), 'error');
                    }
                  } catch {
                    notifyUser(t('contact.error_send'), 'error');
                  } finally {
                    setContactFormSubmitting(false);
                  }
                }}>
                  <input type="text" placeholder={t('contact.placeholder_name')} value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className="input" required />
                  <input type="email" placeholder={t('contact.placeholder_email')} value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className="input" required />
                  <input type="text" placeholder={t('contact.placeholder_subject')} value={contactForm.subject} onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))} className="input" />
                  <textarea placeholder={t('contact.placeholder_message')} value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} className="input min-h-[120px]" required />
                  <Button type="submit" variant="primary" disabled={contactFormSubmitting}>{contactFormSubmitting ? t('contact.sending') : t('contact.send')}</Button>
                </form>
              ) : (
                <p className="text-amber-500/90">{t('contact.success')}</p>
              )}
            </div>
          )}
          {view === 'anfahrt' && (
            <div className="space-y-6">
              <p className="text-zinc-200">{COMPANY_INFO.name}<br />{COMPANY_INFO.address}</p>
              <p className="text-sm text-zinc-500">{t('legal.transport_hint')}</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_INFO.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm uppercase tracking-widest">
                <MapPin className="w-4 h-4" /> {t('legal.maps_open')}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6 font-sans selection:bg-amber-500/30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-900/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-900/20 blur-[120px] rounded-full" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4 shadow-xl">
              <Diamond className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-4xl font-serif italic tracking-tight text-white">Antonio Bellanova</h1>
            <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">Juwelen & Schmuckatelier</p>
          </div>

          <Card className="p-8">
            <div className="flex gap-4 mb-8">
              <button type="button" onClick={() => { setView('login'); setLoginError(null); }} className={`flex-1 pb-4 text-sm font-semibold uppercase tracking-widest transition-all border-b-2 ${view === 'login' ? 'border-amber-600 text-amber-500' : 'border-transparent text-zinc-600'}`}>{t('login')}</button>
              <button type="button" onClick={() => { setView('register'); setLoginError(null); }} className={`flex-1 pb-4 text-sm font-semibold uppercase tracking-widest transition-all border-b-2 ${view === 'register' ? 'border-amber-600 text-amber-500' : 'border-transparent text-zinc-600'}`}>{t('register')}</button>
              <button type="button" onClick={() => { setView('forgot-password'); setLoginError(null); }} className={`flex-1 pb-4 text-sm font-semibold uppercase tracking-widest transition-all border-b-2 ${view === 'forgot-password' ? 'border-amber-600 text-amber-500' : 'border-transparent text-zinc-600'}`}>{t('auth.forgot_password')}</button>
            </div>

            {view === 'forgot-password' && (
              <ForgotPasswordForm onBack={() => setView('login')} onSuccess={() => setView('login')} />
            )}
            {view === 'reset-password' && (
              <ResetPasswordForm token={resetPasswordToken} onBack={() => setView('login')} onSuccess={() => { setView('login'); setResetPasswordToken(''); }} />
            )}
            {view !== 'forgot-password' && view !== 'reset-password' && (
            <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-6">
              {view === 'register' && (
                <>
                  <Input label={t('auth.full_name')} icon={UserIcon} value={name} onChange={(e: any) => setName(e.target.value)} placeholder={t('auth.name_placeholder')} />
                  <Input label={t('auth.username')} icon={UserIcon} value={username} onChange={(e: any) => setUsername(e.target.value)} placeholder={t('auth.username_placeholder')} autoComplete="username" />
                  <Input label={t('address')} icon={MapPin} value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder={t('auth.address_placeholder')} />
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">{t('auth.access_role')}</label>
                    <select value={selectedRole} onChange={(e) => { const v = e.target.value as UserRole; if (v !== UserRole.STRATEGIC_PRIVATE_ADVISOR) setSelectedRole(v); }} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                      <option value={UserRole.CLIENT}>Collector (Client)</option>
                      <option value={UserRole.INVESTOR}>Investor</option>
                      <option value={UserRole.VIEWER}>{t('roles.viewer')}</option>
                      <option value={UserRole.STRATEGIC_PRIVATE_ADVISOR} disabled>{t('roles.advisor')}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">{t('auth.preferred_language')}</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <Input label={t('auth.email_or_username')} icon={Mail} type="text" value={email} onChange={(e: any) => { setEmail(e.target.value); setLoginError(null); }} placeholder={t('auth.email_placeholder')} autoComplete="username" />
              <Input label={t('password')} icon={Lock} type="password" value={password} onChange={(e: any) => { setPassword(e.target.value); setLoginError(null); }} placeholder={t('auth.password_placeholder')} />
              {view === 'login' && loginError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3" role="alert">
                  {loginError}
                </p>
              )}
              {view === 'register' && (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${wantsVip ? 'bg-amber-600 border-amber-600' : 'border-zinc-700 bg-zinc-800'}`}>
                    {wantsVip && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={wantsVip} onChange={() => setWantsVip(!wantsVip)} />
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{t('auth.apply_vip')}</span>
                </label>
              )}

              <Button type="submit" disabled={loading} className="w-full mt-4">
                {loading ? t('auth.processing') : view === 'login' ? t('auth.sign_in') : t('auth.create_account')}
              </Button>
              {view === 'login' && (
                <p className="text-center mt-4">
                  <button type="button" onClick={() => setView('forgot-password')} className="text-sm text-amber-500 hover:text-amber-400">{t('auth.forgot_password_link')}</button>
                </p>
              )}
            </form>
            )}
          </Card>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" /> {t('legal.ssl')}</span>
            <span>{t('trust.dsgvo_compliant')}</span>
            <span>{t('legal.secure_payment')}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-[10px] text-zinc-600">
            <button type="button" onClick={() => setView('impressum')} className="hover:text-amber-500/80">{t('legal.imprint')}</button>
            <span>·</span>
            <button type="button" onClick={() => setView('datenschutz')} className="hover:text-amber-500/80">{t('legal.privacy')}</button>
            <span>·</span>
            <button type="button" onClick={() => setView('agb')} className="hover:text-amber-500/80">{t('legal.terms')}</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('vault-theme', next); } catch (_) {}
  };

  const closeDrawer = () => setSidebarOpen(false);
  const navItem = (viewKey: string, Icon: any, label: string) => ({ viewKey, Icon, label });
  const navItems = [
    navItem('dashboard', TrendingUp, t('dashboard')),
    navItem('marketplace', ShoppingBag, t('marketplace')),
    navItem('drops', Package, t('drops.title')),
    navItem('auctions', Gavel, t('auctions')),
    navItem('vault', ShieldCheck, t('vault')),
    ...(user.role !== 'black' && user.role !== UserRole.BLACK ? [navItem('concierge', MessageCircle, t('chat.concierge'))] : []),
    ...(user.role === 'black' || user.role === UserRole.BLACK ? [navItem('concierge', MessageCircle, t('chat.direct_line'))] : []),
    navItem('portfolio', Award, t('view.portfolio')),
    ...(user.role !== UserRole.ADMIN ? [navItem('fractional', PieChart, t('view.fractional'))] : []),
    ...(user.role === UserRole.INVESTOR ? [navItem('investor', BarChart3, t('investor.title'))] : []),
    ...(user.role === UserRole.STRATEGIC_PRIVATE_ADVISOR ? [navItem('advisor', BarChart3, t('advisor.title') || 'Advisor')] : []),
    ...(user.role === UserRole.ADMIN ? [navItem('admin', Users, t('management'))] : []),
  ];

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-500/30 ${theme === 'light' ? 'bg-zinc-100 text-zinc-900' : 'bg-[#050505] text-zinc-100'}`} data-theme={theme}>
      {/* Desktop Sidebar (hidden on mobile) */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-900 z-50 flex-col">
        <div className="p-6 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center">
            <Diamond className="w-5 h-5 text-amber-500" />
          </div>
          <span className="font-serif italic text-lg text-amber-500">{t('vault')}</span>
        </div>
        <div className="flex-1 px-4 space-y-2">
          {navItems.map(({ viewKey, Icon, label }) => (
            <NavItem key={viewKey} active={view === viewKey} icon={Icon} label={label} onClick={() => setView(viewKey as any)} />
          ))}
        </div>
        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={async () => { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); setUser(null); }}>
            <LogOut className="w-5 h-5 text-zinc-500" />
            <span className="text-sm text-zinc-400">{t('sign_out')}</span>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay + drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[55] md:hidden" onClick={closeDrawer} aria-hidden />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.2 }} className="fixed inset-y-0 left-0 z-[60] w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-900 flex flex-col md:hidden">
              <div className="p-4 flex items-center justify-between border-b border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center">
                    <Diamond className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="font-serif italic text-lg text-amber-500">{t('vault')}</span>
                </div>
                <button type="button" onClick={closeDrawer} className="p-2 rounded-full hover:bg-white/5 transition-colors" aria-label={t('close')}>
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {navItems.map(({ viewKey, Icon, label }) => (
                  <NavItem key={viewKey} active={view === viewKey} icon={Icon} label={label} onClick={() => { setView(viewKey as any); closeDrawer(); }} />
                ))}
              </div>
              <div className="p-4 border-t border-zinc-900">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer min-h-[44px]" onClick={async () => { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); setUser(null); closeDrawer(); }}>
                  <LogOut className="w-5 h-5 text-zinc-500" />
                  <span className="text-sm text-zinc-400">{t('sign_out')}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pl-0 md:pl-64 min-h-screen">
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-4 sm:px-6 md:px-8 glass sticky top-0 z-40 safe-area-top safe-area-left safe-area-right">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button type="button" onClick={() => setSidebarOpen(true)} className="flex md:hidden p-2 rounded-full hover:bg-white/5 transition-colors shrink-0" aria-label={t('view.dashboard')}>
              <Menu className="w-6 h-6 text-zinc-400" />
            </button>
            <h2 className="text-xl font-serif italic text-white capitalize shrink-0">{(t as (k: string) => string)(`view.${view}`) || view}</h2>
            {user && (
              <div className="relative max-w-xs w-full hidden sm:block">
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={globalSearchQuery}
                  onChange={(e) => { setGlobalSearchQuery(e.target.value); setShowSearchResults(true); }}
                  onFocus={() => setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 180)}
                  className="global-search-input w-full bg-zinc-800/80 border border-zinc-700 rounded-lg py-2 pl-3 pr-8 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-600/50"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {showSearchResults && globalSearchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                    {(() => {
                      const q = globalSearchQuery.trim().toLowerCase();
                      const filtered = masterpieces.filter(p => (p.title?.toLowerCase().includes(q) || (p.serial_id && String(p.serial_id).toLowerCase().includes(q))));
                      if (filtered.length === 0) return <p className="px-4 py-3 text-sm text-zinc-500">{t('search.no_results')}</p>;
                      return filtered.slice(0, 10).map(piece => (
                        <button key={piece.id} type="button" onClick={() => { setView('marketplace'); setSelectedPiece(piece); setGlobalSearchQuery(''); setShowSearchResults(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800/80 flex items-center gap-3 border-b border-zinc-800/50 last:border-0">
                          {piece.image_url ? <img src={piece.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" /> : <div className="w-10 h-10 rounded bg-zinc-800 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">{piece.title}</p>
                            <p className="text-xs text-zinc-500">{piece.serial_id} · {getPiecePriceDisplay(piece, user).label}</p>
          </div>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-white/5 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-zinc-400" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border border-zinc-950" />
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-[60] overflow-hidden"
                  >
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center flex-wrap gap-2">
                      <h4 className="text-xs uppercase tracking-widest font-bold text-zinc-400">{t('notifications.title')}</h4>
                      <div className="flex gap-2">
                        <button className="text-[10px] text-zinc-500 hover:text-amber-500" onClick={() => { setShowNotifications(false); setShowNotificationPrefsModal(true); }}>{t('common.settings')}</button>
                        {notifications.some(n => !n.is_read) && (
                          <button className="text-[10px] text-amber-500 hover:text-amber-400" onClick={async () => {
                            if (!user) return;
                            await fetch(`/api/notifications/${user.id}/read-all`, { method: 'POST' });
                            fetchData();
                          }}>Alle gelesen</button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? notifications.slice(0, 15).map(n => (
                        <div key={n.id} className="p-4 border-b border-zinc-800/50 hover:bg-white/5 transition-colors">
                          <p className="text-xs text-zinc-200 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-zinc-500 mt-2">{new Date(n.created_at).toLocaleString('de-DE')}</p>
                        </div>
                      )) : (
                        <PremiumEmptyState icon={Bell} title={t('notifications.empty_title')} subtitle={t('notifications.empty_subtitle')} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/5 transition-colors" aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun className="w-5 h-5 text-zinc-400 hover:text-amber-500" /> : <Moon className="w-5 h-5 text-zinc-500 hover:text-amber-600" />}
            </button>
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
              <select value={language} onChange={(e) => {
                const lang = e.target.value;
                setLanguage(lang);
                if (user?.id) fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, language: lang }) }).catch(() => {});
              }} className="bg-transparent border-none text-[10px] uppercase font-bold text-zinc-400 focus:ring-0 focus:outline-none cursor-pointer hover:text-amber-500/80 appearance-none pr-6 py-1" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', backgroundSize: '14px' }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setShowShortcutsModal(true)} className="p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-amber-500 text-xs font-bold" title={t('shortcuts.title')}>?</button>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2 justify-end">
                <p className="text-sm font-medium text-zinc-200">{user.name}</p>
                  {(user.role === 'vip' || user.role === UserRole.VIP || user.is_vip) && <Badge variant="vip" icon={Diamond}>VIP</Badge>}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-amber-500">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center ring-2 ring-transparent hover:ring-amber-500/20 transition-all">
                <UserIcon className="w-5 h-5 text-zinc-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Premium Trust Bar */}
        {user && (
          <div className="trust-bar px-4 sm:px-6 md:px-8 py-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" /> {t('trust.secured_by')}</span>
            <span>{t('trust.ssl_encrypted')}</span>
            <span>{t('trust.dsgvo_compliant')}</span>
            {visiblePortfolioPieces.length > 0 && (
              <span className="text-amber-500/90 font-semibold">
                Portfolio · {visiblePortfolioPieces.reduce((sum: number, p: any) => sum + (Number(p.valuation) || 0), 0).toLocaleString('de-DE')} €
              </span>
            )}
            {favoriteIds.length > 0 && (
              <button type="button" onClick={() => setView('marketplace')} className="text-amber-500/90 hover:text-amber-400 font-semibold">
                {favoriteIds.length} {t('wishlist.on_list')}
              </button>
            )}
          </div>
        )}

        {/* Global loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] premium-loading-overlay flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                <p className="text-xs uppercase tracking-widest text-zinc-400">{t('loading.please_wait')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline banner */}
        {!isOnline && (
          <div className="sticky top-0 z-[45] bg-amber-500/90 text-black text-center py-2 text-xs font-bold uppercase tracking-widest">
            {t('offline.banner')}
          </div>
        )}

        {/* Success overlay */}
        <AnimatePresence>
          {showSuccessOverlay && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[190] bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-xl font-serif italic text-zinc-100">{showSuccessOverlay.message}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification prefs modal */}
        <AnimatePresence>
          {showNotificationPrefsModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[195] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowNotificationPrefsModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4">
                <h4 className="text-lg font-serif italic">{t('notifications.title')}</h4>
                <p className="text-xs text-zinc-500">{t('notifications.description')}</p>
                {['email_messages', 'email_contracts', 'email_auctions'].map(key => (
                  <label key={key} className="flex items-center justify-between gap-4 cursor-pointer">
                    <span className="text-sm text-zinc-300">{key === 'email_messages' ? t('notifications.email_messages') : key === 'email_contracts' ? t('notifications.email_contracts') : t('notifications.email_auctions')}</span>
                    <input type="checkbox" checked={(notificationPrefs as any)[key]} onChange={e => setNotificationPrefs(p => ({ ...p, [key]: e.target.checked }))} className="rounded border-zinc-600 text-amber-600" />
                  </label>
                ))}
                <div className="flex gap-2 pt-2">
                  <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800 mt-2">
                    <button type="button" onClick={() => { setShowNotificationPrefsModal(false); setShowPasswordChangeModal(true); }} className="text-amber-500 hover:text-amber-400">{t('notifications.change_password')}</button>
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowNotificationPrefsModal(false)}>{t('notifications.close')}</Button>
                  <Button variant="primary" className="flex-1" onClick={async () => {
                    if (user) await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, notification_prefs: JSON.stringify(notificationPrefs) }) });
                    setShowNotificationPrefsModal(false);
                    notifyUser(t('common.settings_saved'), 'success');
                  }}>{t('save')}</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Passwort ändern modal */}
        <AnimatePresence>
          {showPasswordChangeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[195] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowPasswordChangeModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4">
                <h4 className="text-lg font-serif italic">{t('notifications.change_password')}</h4>
                <Input type="password" label={t('settings.current_password')} value={changePasswordForm.current} onChange={(e: any) => { setChangePasswordForm(f => ({ ...f, current: e.target.value })); setChangePasswordError(''); }} placeholder="••••••••" />
                <Input type="password" label={t('settings.new_password')} value={changePasswordForm.new} onChange={(e: any) => { setChangePasswordForm(f => ({ ...f, new: e.target.value })); setChangePasswordError(''); }} placeholder="••••••••" />
                <Input type="password" label={t('settings.confirm_password')} value={changePasswordForm.confirm} onChange={(e: any) => { setChangePasswordForm(f => ({ ...f, confirm: e.target.value })); setChangePasswordError(''); }} placeholder="••••••••" />
                {changePasswordError && <p className="text-sm text-red-400">{changePasswordError}</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => { setShowPasswordChangeModal(false); setChangePasswordForm({ current: '', new: '', confirm: '' }); setChangePasswordError(''); }}>{t('cancel')}</Button>
                  <Button variant="primary" className="flex-1" disabled={changePasswordSubmitting} onClick={async () => {
                    setChangePasswordError('');
                    if (changePasswordForm.new.length < 6) { setChangePasswordError(t('settings.password_min_length')); return; }
                    if (changePasswordForm.new !== changePasswordForm.confirm) { setChangePasswordError(t('settings.password_mismatch')); return; }
                    setChangePasswordSubmitting(true);
                    try {
                      const res = await fetch('/api/users/me/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: changePasswordForm.current, newPassword: changePasswordForm.new }), credentials: 'include' });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok) { setShowPasswordChangeModal(false); setChangePasswordForm({ current: '', new: '', confirm: '' }); notifyUser(t('settings.password_changed'), 'success'); }
                      else setChangePasswordError(data.error || t('settings.password_change_error'));
                    } catch { setChangePasswordError(t('settings.network_error')); }
                    finally { setChangePasswordSubmitting(false); }
                  }}>{changePasswordSubmitting ? t('settings.changing_password') : t('notifications.change_password')}</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shortcuts modal */}
        <AnimatePresence>
          {showShortcutsModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[195] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowShortcutsModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
                <h4 className="text-lg font-serif italic">{t('shortcuts.title')}</h4>
                <div className="space-y-2 text-sm text-zinc-400">
                  <p><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">Esc</kbd> {t('shortcuts.close_modal')}</p>
                  <p><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">Strg+K</kbd> {t('shortcuts.focus_search')}</p>
                  <p><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">?</kbd> {t('shortcuts.this_help')}</p>
                </div>
                <Button variant="ghost" className="w-full" onClick={() => setShowShortcutsModal(false)}>{t('close')}</Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breadcrumbs */}
        {user && view !== 'dashboard' && view !== 'login' && view !== 'register' && !['forgot-password', 'reset-password'].includes(view) && (
          <div className="px-4 sm:px-6 md:px-8 pt-6 max-w-7xl mx-auto flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
            <button type="button" onClick={() => setView('dashboard')} className="hover:text-amber-500/80">{t('dashboard')}</button>
            <span>/</span>
            {view === 'vault' ? (
              <>
                <button type="button" onClick={() => setView('vault')} className="hover:text-amber-500/80">{t('vault')}</button>
                {vaultTab !== 'pieces' && <><span>/</span><span className="text-zinc-400">{vaultTab === 'certs' ? t('certificates') : vaultTab === 'contracts' ? t('contracts') : vaultTab === 'payments' ? t('payments') : vaultTab === 'auctions' ? t('my_bids') : vaultTab === 'resale' ? t('resale') : vaultTab === 'service' ? t('service') : vaultTab === 'vip' ? t('vip') : vaultTab === 'legacy' ? (t('vault.legacy') || 'Legacy') : vaultTab}</span></>}
              </>
            ) : (
              <span className="text-zinc-400">{(t as (k: string) => string)(`view.${view}`) || view}</span>
            )}
          </div>
        )}

        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 space-y-6" hoverGlow>
                    <h3 className="text-3xl font-serif italic">{t('welcome')}, {user.name.split(' ')[0]}</h3>
                    <p className="text-zinc-400">{t('dashboard.welcome_subtitle')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      <StatCard label={t('my_assets')} value={visiblePortfolioPieces.length} icon={Award} />
                      <StatCard label={t('certificates')} value={vaultData.certs.length} icon={ShieldCheck} />
                      <StatCard label={t('dashboard.active_orders')} value={payments.filter(p => p.status === 'pending').length} icon={Package} />
                      <StatCard label={t('dashboard.registry_entries')} value={visiblePortfolioPieces.length} icon={BookOpen} />
                      <StatCard label={t('dashboard.resale_opportunities')} value={visiblePortfolioPieces.length} icon={TrendingUp} />
                      <StatCard label={t('dashboard.value_development')} value={visiblePortfolioPieces.reduce((s: number, p: any) => s + (Number(p.valuation) || 0), 0).toLocaleString('de-DE') + ' €'} icon={LineChart} />
                      <StatCard label={t('dashboard.service_restoration')} value="—" icon={Wrench} />
                      <StatCard label={t('active_bids')} value={auctions.filter(a => a.highest_bidder_id === user.id).length} icon={Gavel} />
                    </div>
                  </Card>
                  <Card className="flex flex-col justify-center items-center text-center space-y-4 border-amber-500/20 bg-amber-500/5" hoverGlow>
                    <Award className="w-12 h-12 text-amber-500" />
                    <h4 className="text-xl font-serif italic">{t('membership')}</h4>
                    <div className="w-full space-y-3 text-left">
                      <div className="flex justify-between items-center text-xs"><span className="text-zinc-500">{t('identity.client_id')}</span><span className="font-mono text-amber-500/90">AB-{String(user.id).padStart(5, '0')}</span></div>
                      <div className="flex justify-between items-center text-xs"><span className="text-zinc-500">{t('identity.prestige_level')}</span><span className="text-zinc-200">{(t as (k: string) => string)(`prestige.${(user as any).prestige_tier || user.role}`) || (user as any).prestige_tier || user.role}</span></div>
                      <div className="flex justify-between items-center text-xs"><span className="text-zinc-500">{t('identity.member_tier')}</span><Badge variant="amber">{(user as any).prestige_tier ? (t as (k: string) => string)(`prestige.${(user as any).prestige_tier}`) : user.role}</Badge></div>
                      <div className="flex justify-between items-center text-xs"><span className="text-zinc-500">{t('identity.asset_count')}</span><span className="text-zinc-200">{visiblePortfolioPieces.length}</span></div>
                      <div className="flex justify-between items-center text-xs"><span className="text-zinc-500">{t('identity.vault_status')}</span><span className={vaultData.pieces?.length > 0 || vaultData.certs?.length > 0 ? 'text-emerald-400' : 'text-zinc-400'}>{vaultData.pieces?.length > 0 || vaultData.certs?.length > 0 ? t('identity.vault_active') : t('identity.vault_ready')}</span></div>
                    </div>
                    <p className="text-xs text-zinc-500 pt-2 border-t border-amber-500/20 w-full">{t('dashboard.member_since')} {new Date(user.created_at).toLocaleDateString()}</p>
                  </Card>
                </div>

                {/* Concierge CTA — Premium */}
                {user.role !== UserRole.ADMIN && (
                  <Card className="border-amber-500/15 bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden" hoverGlow>
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <MessageCircle className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-serif italic text-zinc-100">{t('concierge.cta_title')}</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">{t('concierge.cta_subtitle')}</p>
                        </div>
                      </div>
                      <Button variant="primary" className="shrink-0 text-xs font-bold uppercase tracking-widest" onClick={() => setView('concierge')}>
                        <MessageCircle className="w-4 h-4" /> {t('chat.concierge')}
                      </Button>
                    </div>
                  </Card>
                )}

                {user.role !== UserRole.ADMIN && userAppointments.length > 0 && (
                  <Card className="space-y-4" hoverGlow>
                    <h4 className="text-lg font-serif italic">{t('appointments.my_appointments')}</h4>
                    <div className="space-y-3">
                      {userAppointments.map(a => (
                        <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                          <div>
                            <p className="text-sm text-zinc-200">{(a as any).admin_name} · {new Date(a.scheduled_at).toLocaleString()}</p>
                            {a.title && <p className="text-xs text-zinc-500">{a.title}</p>}
                          </div>
                          <div className="flex gap-2">
                            {a.status === 'proposed' && (
                              <>
                                <Button variant="outline" className="py-1.5 px-3 text-xs" disabled={loading} onClick={() => handleAppointmentRespond(a.id, 'confirmed')}>{t('appointments.accept')}</Button>
                                <Button variant="danger" className="py-1.5 px-3 text-xs" disabled={loading} onClick={() => handleAppointmentRespond(a.id, 'cancelled')}>{t('appointments.decline')}</Button>
                              </>
                            )}
                            {a.status !== 'proposed' && <Badge variant={a.status === 'confirmed' ? 'emerald' : 'red'}>{a.status}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Zuletzt angesehen */}
                {recentlyViewedIds.length > 0 && (
                  <Card className="space-y-4" hoverGlow>
                    <h4 className="text-lg font-serif italic">{t('dashboard.recent_views')}</h4>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {recentlyViewedIds.map(id => {
                        const piece = masterpieces.find(p => p.id === id);
                        if (!piece) return null;
                        return (
                          <button key={piece.id} type="button" onClick={() => setSelectedPiece(piece)} className="shrink-0 w-32 text-left group">
                            <div className="aspect-square rounded-xl bg-zinc-800 overflow-hidden mb-2 group-hover:ring-2 ring-amber-500/30 transition-all">
                              <img src={piece.image_url || `https://picsum.photos/seed/${piece.id}/200/200`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <p className="text-xs font-medium text-zinc-200 truncate">{piece.title}</p>
                            <p className="text-[10px] text-amber-500">{getPiecePriceDisplay(piece, user).label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {favoriteIds.length > 0 && (
                  <Card className="space-y-4" hoverGlow>
                    <h4 className="text-lg font-serif italic">{t('dashboard.favorites')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {masterpieces.filter(p => favoriteIds.includes(p.id)).map(piece => (
                        <div key={piece.id} className="relative group p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                          {piece.image_url && <img src={piece.image_url} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />}
                          <p className="text-sm font-medium text-zinc-200 truncate">{piece.title}</p>
                          <p className="text-xs text-zinc-500">{getPiecePriceDisplay(piece, user).label}</p>
                          <Button variant="ghost" className="mt-2 text-xs py-1" onClick={() => {
                            fetch('/api/analytics/favorite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, masterpieceId: piece.id, add: false }) })
                              .then(() => setFavoriteIds(prev => prev.filter(id => id !== piece.id)));
                          }}>{t('dashboard.remove_favorite')}</Button>
                          <Button variant="ghost" className="mt-1 text-xs py-1 ml-2" onClick={() => setSelectedPiece(piece)}>{t('view')}</Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {recentlyViewedIds.length > 0 && (
                  <Card className="space-y-4" hoverGlow>
                    <h4 className="text-lg font-serif italic">{t('dashboard.recent_views')}</h4>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {recentlyViewedIds.map(id => masterpieces.find(p => p.id === id)).filter(Boolean).map((piece: Masterpiece) => (
                        <button key={piece.id} type="button" onClick={() => setSelectedPiece(piece)} className="shrink-0 w-32 text-left group">
                          <div className="aspect-square rounded-xl bg-zinc-800 overflow-hidden mb-2">
                            <img src={piece.image_url || `https://picsum.photos/seed/${piece.id}/200/200`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                          <p className="text-xs font-medium text-zinc-200 truncate">{piece.title}</p>
                          <p className="text-[10px] text-amber-500/90">{getPiecePriceDisplay(piece, user).label}</p>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}

                {atelierMoments.length > 0 && (
                  <Card className="space-y-4" hoverGlow>
                    <h4 className="text-lg font-serif italic">{t('admin.atelier_moments')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {atelierMoments.slice(0, 4).map((m: any, i: number) => (
                        <div key={m.id || i} className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
                          {m.image_url && <img src={m.image_url} alt="" className="w-full aspect-video object-cover" />}
                          <div className="p-4">
                            <p className="font-serif italic text-zinc-200">{m.title}</p>
                            {m.subtitle && <p className="text-xs text-zinc-500 mt-1">{m.subtitle}</p>}
                            {m.body && <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{m.body}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="space-y-4">
                  <h4 className="text-sm uppercase tracking-widest text-zinc-500 font-bold">{t('featured')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {masterpieces.filter(p => p.status === 'available').slice(0, 3).map(piece => (
                      <PieceCard 
                        key={piece.id} 
                        piece={piece} 
                        t={t}
                        priceLabel={getPiecePriceDisplay(piece, user).label}
                        isFavorite={user ? favoriteIds.includes(piece.id) : false}
                        onToggleFavorite={user ? () => {
                          const add = !favoriteIds.includes(piece.id);
                          fetch('/api/analytics/favorite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, masterpieceId: piece.id, add }) })
                            .then(() => setFavoriteIds(prev => add ? [...prev, piece.id] : prev.filter(id => id !== piece.id))).catch(() => {});
                        } : undefined}
                        onBuy={(user.role === UserRole.VIEWER || user.role === UserRole.INVESTOR) ? undefined : () => handleBuy(piece.id)} 
                        onViewDetails={(p) => {
                          setSelectedPiece(p);
                          if (user.role === UserRole.INVESTOR) logInvestorView(p.id, 2);
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'marketplace' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-end flex-wrap gap-4">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif italic">{t('marketplace')}</h3>
                    <p className="text-zinc-500">{t('marketplace.subtitle')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <input type="text" placeholder={t('marketplace.filter_placeholder')} value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-4 text-zinc-200 text-sm w-48 md:w-64" />
                    <select value={filterRarity} onChange={e => setFilterRarity(e.target.value)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm">
                      <option value="">{t('filter.rarity_all')}</option>
                      <option value="Unikat">{t('filter.rarity_unique')}</option>
                      <option value="Limitiert">{t('filter.rarity_limited')}</option>
                      <option value="Selten">{t('filter.rarity_rare')}</option>
                    </select>
                    <select value={sortMarket} onChange={e => setSortMarket(e.target.value as typeof sortMarket)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm">
                      <option value="newest">Neueste</option>
                      <option value="price_asc">Preis aufsteigend</option>
                      <option value="price_desc">Preis absteigend</option>
                      <option value="title">Titel A–Z</option>
                    </select>
                    {user && (
                      <select value={filterMarketScope} onChange={e => setFilterMarketScope(e.target.value as typeof filterMarketScope)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm">
                        <option value="all">Alle Stücke</option>
                        <option value="favorites">{t('filter.favorites_only')}</option>
                        <option value="recent">{t('filter.recent_only')}</option>
                      </select>
                    )}
                    <Button variant="outline" className="text-sm gap-2" onClick={() => setShowMarketplacePdfModal(true)}>
                      <Download className="w-4 h-4" /> Marktplatz als PDF
                    </Button>
                  </div>
                </div>
                {showMarketplacePdfModal && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowMarketplacePdfModal(false)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
                      <h4 className="text-lg font-serif italic text-zinc-100 mb-2">Marktplatz als PDF</h4>
                      <p className="text-sm text-zinc-500 mb-4">Download-Sprache wählen</p>
                      <select value={marketplacePdfLang} onChange={e => setMarketplacePdfLang(e.target.value as 'de' | 'en' | 'it')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-200 mb-4">
                        <option value="de">Deutsch</option>
                        <option value="en">English</option>
                        <option value="it">Italiano</option>
                      </select>
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => { downloadMarketplacePdf(marketplacePdfLang); setShowMarketplacePdfModal(false); }}>PDF herunterladen</Button>
                        <Button variant="secondary" onClick={() => setShowMarketplacePdfModal(false)}>Abbrechen</Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {listLoading && masterpieces.length === 0 ? (
                    [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                  ) : (
                    <>
                      {filterMasterpieces(masterpieces, 'available').map(piece => (
                    <PieceCard 
                      key={piece.id} 
                      piece={piece} 
                          t={t}
                          priceLabel={getPiecePriceDisplay(piece, user).label}
                          isFavorite={user ? favoriteIds.includes(piece.id) : false}
                          onToggleFavorite={user ? () => {
                            const add = !favoriteIds.includes(piece.id);
                            fetch('/api/analytics/favorite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, masterpieceId: piece.id, add }) })
                              .then(() => setFavoriteIds(prev => add ? [...prev, piece.id] : prev.filter(id => id !== piece.id))).catch(() => {});
                          } : undefined}
                      onBuy={(user.role === UserRole.VIEWER || user.role === UserRole.INVESTOR) ? undefined : () => handleBuy(piece.id)} 
                      onViewDetails={(p) => {
                        setSelectedPiece(p);
                        if (user.role === UserRole.INVESTOR) logInvestorView(p.id, 3);
                      }} 
                    />
                  ))}
                      {filterMasterpieces(masterpieces, 'available').length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
                      <ShoppingBag className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                          <p className="text-zinc-500">{(filterSearch || filterRarity) ? 'Keine Treffer.' : t('marketplace.no_pieces')}</p>
                    </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'drops' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h3 className="text-3xl font-serif italic">{t('drops.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dropsList.length === 0 && (
                    <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-2xl">
                      <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-500">{t('marketplace.no_pieces')}</p>
                    </div>
                  )}
                  {dropsList.map((d: any) => {
                    const end = new Date(d.end_at).getTime();
                    const now = Date.now();
                    const ended = end <= now;
                    const release = new Date(d.release_at).getTime();
                    const countdownMs = release > now ? release - now : (end > now ? end - now : 0);
                    const countdownStr = countdownMs > 0 ? (Math.floor(countdownMs / 86400000) + 'd ' + Math.floor((countdownMs % 86400000) / 3600000) + 'h') : '';
                    return (
                      <Card key={d.id} className="overflow-hidden" hoverGlow>
                        {d.image_url && <img src={d.image_url} alt="" className="w-full aspect-video object-cover" />}
                        <div className="p-4 space-y-2">
                          <h4 className="font-serif italic text-zinc-100">{d.title}</h4>
                          {d.description && <p className="text-xs text-zinc-500 line-clamp-2">{d.description}</p>}
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant={ended ? 'default' : d.status === 'live' ? 'emerald' : 'amber'}>{ended ? t('drops.ended') : d.status}</Badge>
                            {countdownStr && <span className="text-amber-500/90">{t('drops.countdown')} {countdownStr}</span>}
                          </div>
                          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => fetch(`/api/drops/${d.id}/pieces`).then(r => r.json()).then((pieces: any[]) => { if (pieces.length) setSelectedPiece(pieces[0]); })}>
                            {t('view')}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {view === 'concierge' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-[calc(100vh-12rem)] min-h-[400px]"
              >
                {/* Maison Concierge header — dark luxury, serif, status, priority */}
                <header className="mb-8">
                  <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                    <h2 className="font-serif text-2xl md:text-3xl text-zinc-100 tracking-tight italic">
                      {t('chat.maison_concierge')}
                    </h2>
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                      {conciergeStatus.some(c => c.status === 'available') && (
                        <span className="text-zinc-400">{t('chat.status_active')}</span>
                      )}
                      {conciergeStatus.some(c => c.status === 'busy') && (
                        <span className="text-amber-600/90">{t('chat.status_reviewing')}</span>
                      )}
                      {(conciergeStatus.length === 0 || conciergeStatus.every(c => c.status === 'away')) && selectedChatThread && (
                        <span className="text-zinc-500">{t('chat.status_preparing')}</span>
                      )}
                      {selectedChatThread && selectedChatThread.priority > 1 && (
                        <span className="text-amber-500/80 border-b border-amber-500/30 pb-0.5">
                          {t('chat.priority_channel_active')}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2">{t('concierge.secure_logged')}</p>
                </header>

                <div className="flex flex-1 min-h-0 border border-zinc-800/80 rounded-sm overflow-hidden bg-zinc-950/80">
                  {/* Thread list — minimal, generous whitespace */}
                  <aside className="w-64 md:w-72 border-r border-zinc-800/80 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-zinc-800/80">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user) return;
                          const res = await fetch('/api/communication/threads', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id, type: 'concierge' })
                          });
                          if (res.ok) {
                            const { id } = await res.json();
                            if (id) {
                              const list = await fetch(`/api/communication/threads?userId=${user.id}`).then(r => r.json()).catch(() => []);
                              setChatThreads(list);
                              const thread = list.find((t: ChatThread) => t.id === id);
                              if (thread) setSelectedChatThread(thread);
                            }
                          }
                        }}
                        className="w-full py-2.5 text-left text-[13px] font-medium text-zinc-400 hover:text-amber-500/90 transition-colors duration-200"
                      >
                        {t('chat.new_conversation')}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {chatThreads.length === 0 && (
                        <p className="p-6 text-zinc-600 text-[13px] leading-relaxed">{t('chat.no_threads')}</p>
                      )}
                      {chatThreads.map(th => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setSelectedChatThread(th)}
                          className={`w-full text-left px-5 py-4 border-b border-zinc-800/50 transition-colors duration-200 ${selectedChatThread?.id === th.id ? 'bg-zinc-800/40 text-zinc-100' : 'hover:bg-zinc-800/20 text-zinc-500 hover:text-zinc-300'}`}
                        >
                          <span className="block text-[13px] font-normal truncate">{th.type === 'concierge' ? t('chat.concierge') : th.masterpiece_title || th.type}</span>
                          {(th.serial_id || th.priority > 1) && (
                            <span className="mt-1 block text-[11px] text-zinc-600">
                              {th.serial_id || (th.priority > 1 ? t('chat.priority') : '')}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </aside>

                  {/* Message area — no bubbles, minimalist lines, role-based styling */}
                  <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/50">
                    {selectedChatThread ? (
                      <>
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 space-y-8">
                          {chatMessages.map((m, i) => {
                            const isOwn = m.sender_id === user?.id;
                            const role = (user?.role as string) || 'client';
                            const isVip = role === 'vip' || role === UserRole.VIP;
                            const isRoyal = role === 'royal' || role === UserRole.ROYAL;
                            const isBlack = role === 'black' || role === UserRole.BLACK;
                            const isAdmin = role === 'admin' || role === UserRole.ADMIN;
                            const ownBorder = isBlack ? 'border-zinc-600' : isRoyal ? 'border-amber-600/50' : isVip ? 'border-amber-500/30' : isAdmin ? 'border-zinc-500' : 'border-zinc-600/80';
                            const ownText = isBlack ? 'text-zinc-300' : isRoyal ? 'text-amber-100/95' : isVip ? 'text-amber-50/90' : isAdmin ? 'text-zinc-200' : 'text-zinc-200';
                            return (
                              <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[75%] ${isOwn ? 'text-right' : 'text-left'}`}>
                                  <div
                                    className={`py-2 ${isOwn ? `pl-4 border-r-2 ${ownBorder} ${ownText} ${isRoyal ? 'shadow-[0_0_24px_rgba(180,140,60,0.06)]' : ''} ${isBlack ? 'shadow-[0_0_20px_rgba(0,0,0,0.15)]' : ''}` : 'pr-4 border-l-2 border-zinc-600/80 text-zinc-300'}`}
                                  >
                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words font-normal">
                                      {m.content}
                                    </p>
                                    <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-600">
                                      {new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                          {/* Subtle typing indicator when Maison status is not available */}
                          {selectedChatThread && chatMessages.length > 0 && !conciergeStatus.some(c => c.status === 'available') && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                              className="flex justify-start"
                            >
                              <div className="py-2 pr-4 border-l-2 border-zinc-600/60 text-zinc-500">
                                <p className="text-[12px] italic">{t('chat.maison_typing')}</p>
                                <span className="inline-flex gap-1 mt-1">
                                  {[0, 1, 2].map(j => (
                                    <motion.span
                                      key={j}
                                      className="w-1 h-1 rounded-full bg-zinc-600"
                                      animate={{ opacity: [0.4, 1, 0.4] }}
                                      transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }}
                                    />
                                  ))}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <div className="border-t border-zinc-800/80 p-4">
                          <div className="flex gap-3 max-w-2xl mx-auto">
                            <input
                              type="text"
                              value={chatDraft}
                              onChange={e => setChatDraft(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (chatDraft.trim() && user) {
                                    fetch(`/api/communication/threads/${selectedChatThread.id}/messages`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ userId: user.id, content: chatDraft.trim(), contentLang: language })
                                    }).then(r => r.json()).then(msg => {
                                      if (msg.id) setChatMessages(prev => [...prev, msg]);
                                      setChatDraft('');
                                    }).catch(() => {});
                                  }
                                }
                              }}
                              placeholder={t('chat.type_message')}
                              className="flex-1 bg-transparent border border-zinc-700 rounded-sm px-4 py-2.5 text-[14px] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!chatDraft.trim() || !user) return;
                                fetch(`/api/communication/threads/${selectedChatThread.id}/messages`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: user.id, content: chatDraft.trim(), contentLang: language })
                                }).then(r => r.json()).then(msg => {
                                  if (msg.id) setChatMessages(prev => [...prev, msg]);
                                  setChatDraft('');
                                }).catch(() => {});
                              }}
                              className="px-4 py-2.5 border border-zinc-600 text-zinc-300 hover:border-amber-600/50 hover:text-amber-500/90 transition-colors duration-200 text-[13px] uppercase tracking-widest"
                            >
                              {t('chat.send')}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-zinc-600">
                        <p className="text-[13px]">{t('chat.no_threads')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'auctions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex flex-wrap justify-between items-end gap-4">
                <div className="space-y-2">
                    <h3 className="text-3xl font-serif italic">{t('auctions.private_auctions')}</h3>
                    <p className="text-zinc-500">{t('auctions.subtitle')}</p>
                  </div>
                  {user && (
                    <select value={filterMarketScope} onChange={e => setFilterMarketScope(e.target.value as typeof filterMarketScope)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm">
                      <option value="all">Alle Auktionen</option>
                      <option value="favorites">{t('filter.favorites_only')}</option>
                      <option value="recent">{t('filter.recent_only')}</option>
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {listLoading && auctions.length === 0 ? (
                    [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                  ) : (
                    <>
                  {(filterMarketScope === 'all' ? auctions : filterMarketScope === 'favorites' ? auctions.filter(a => favoriteIds.includes(a.masterpiece_id)) : auctions.filter(a => recentlyViewedIds.includes(a.masterpiece_id))).map(auction => (
                    <AuctionCard 
                      key={auction.id} 
                      auction={auction} 
                      onBid={(user.role === UserRole.VIEWER || user.role === UserRole.INVESTOR) ? undefined : (amt) => handleBid(auction.id, amt)} 
                      userId={user.id} 
                      isFavorite={user ? favoriteIds.includes(auction.masterpiece_id) : false}
                      onToggleFavorite={user ? () => {
                        const add = !favoriteIds.includes(auction.masterpiece_id);
                        fetch('/api/analytics/favorite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, masterpieceId: auction.masterpiece_id, add }) })
                          .then(() => setFavoriteIds(prev => add ? [...prev, auction.masterpiece_id] : prev.filter(id => id !== auction.masterpiece_id)));
                      } : undefined}
                      onViewDetails={(pId) => {
                        const p = masterpieces.find(m => m.id === pId);
                        if (p) {
                          setSelectedPiece(p);
                          if (user.role === UserRole.INVESTOR) logInvestorView(p.id, 4);
                        }
                      }}
                    />
                  ))}
                  {auctions.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
                      <Gavel className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-500">{t('auctions.no_active')}</p>
                    </div>
                  )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'vault' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {vaultData.contracts.filter((c: Contract) => c.status === 'draft').length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
                    <p className="text-sm text-amber-200">
                      {vaultData.contracts.filter((c: Contract) => c.status === 'draft').length} {t('contracts')} {t('vault.reminder_unsigned')}
                    </p>
                    <Button variant="outline" className="border-amber-500/50 text-amber-200 text-xs" onClick={() => setVaultTab('contracts')}>
                      {t('vault.contracts_show')}
                    </Button>
                  </div>
                )}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  <TabButton active={vaultTab === 'pieces'} label={t('my_pieces')} onClick={() => setVaultTab('pieces')} icon={Award} />
                  <TabButton active={vaultTab === 'certs'} label={t('certificates')} onClick={() => setVaultTab('certs')} icon={ShieldCheck} />
                  <TabButton active={vaultTab === 'contracts'} label={t('contracts')} onClick={() => setVaultTab('contracts')} icon={FileText} />
                  <TabButton active={vaultTab === 'payments'} label={t('payments')} onClick={() => setVaultTab('payments')} icon={CreditCard} />
                  <TabButton active={vaultTab === 'auctions'} label={t('my_bids')} onClick={() => setVaultTab('auctions')} icon={Gavel} />
                  <TabButton active={vaultTab === 'resale'} label={t('resale')} onClick={() => setVaultTab('resale')} icon={TrendingUp} />
                  <TabButton active={vaultTab === 'service'} label={t('service')} onClick={() => setVaultTab('service')} icon={Wrench} />
                  <TabButton active={vaultTab === 'vip'} label={t('vip')} onClick={() => setVaultTab('vip')} icon={Diamond} />
                  <TabButton active={vaultTab === 'legacy'} label={t('vault.legacy') || 'Legacy'} onClick={() => { setVaultTab('legacy'); fetch('/api/legacy/beneficiary', { credentials: 'include' }).then(r => r.ok && r.json().then(setClientLegacyRequests)); }} icon={BookOpen} />
                </div>

                <div className="flex flex-wrap gap-2 pb-4 border-b border-zinc-800/50">
                  <Button variant="outline" className="text-xs" onClick={() => {
                    const doc = new jsPDF();
                    const pageWidth = doc.internal.pageSize.getWidth();
                    doc.setFillColor(253, 252, 251);
                    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
                    doc.setFontSize(10);
                    doc.setTextColor(197, 160, 89);
                    doc.setFont('helvetica', 'bold');
                    doc.text('ANTONIO BELLANOVA', pageWidth / 2, 20, { align: 'center' });
                    doc.setFontSize(16);
                    doc.setTextColor(0, 0, 0);
                    doc.text(t('vault.portfolio_overview'), pageWidth / 2, 32, { align: 'center' });
                    doc.setFontSize(9);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`${user?.name ?? ''} · ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 40, { align: 'center' });
                    let y = 52;
                    const total = visiblePortfolioPieces.reduce((s: number, p: any) => s + (Number(p.valuation) || 0), 0);
                    visiblePortfolioPieces.forEach((p: any) => {
                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(9);
                      doc.setTextColor(0, 0, 0);
                      doc.text(`${p.title ?? ''} (${p.serial_id ?? ''})`, 20, y);
                      doc.text(`${Number(p.valuation || 0).toLocaleString('de-DE')} €`, pageWidth - 20, y, { align: 'right' });
                      y += 7;
                    });
                    doc.setDrawColor(200, 200, 200);
                    doc.line(20, y, pageWidth - 20, y);
                    y += 8;
                    doc.setFont('helvetica', 'bold');
                    doc.text(t('vault.total_value'), 20, y);
                    doc.text(`${total.toLocaleString('de-DE')} €`, pageWidth - 20, y, { align: 'right' });
                    doc.save(`Antonio-Bellanova-Portfolio-${new Date().toISOString().slice(0, 10)}.pdf`);
                  }}>
                    <Download className="w-3 h-3" /> {t('vault.portfolio_pdf')}
                  </Button>
                  <Button variant="outline" className="text-xs" onClick={async () => {
                    if (!user) return;
                    const r = await fetch(`/api/portfolio/export?userId=${user.id}`, { credentials: 'include' });
                    const blob = await r.blob();
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `antonio-bellanova-portfolio-${user.id}.csv`; a.click(); URL.revokeObjectURL(a.href);
                  }}>
                    <FileDown className="w-3 h-3" /> {t('vault.portfolio_csv')}
                  </Button>
                  <Button variant="outline" className="text-xs" onClick={async () => {
                    if (!user) return;
                    const r = await fetch(`/api/me/export?userId=${user.id}`);
                    const blob = await r.blob();
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `antonio-bellanova-daten-${user.id}.json`; a.click(); URL.revokeObjectURL(a.href);
                  }}>
                    <FileDown className="w-3 h-3" /> {t('vault.export_my_data_gdpr')}
                  </Button>
                </div>

                <div className="min-h-[400px]">
                  {vaultTab === 'pieces' && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listLoading && vaultData.pieces.length === 0 ? (
                          [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                        ) : (
                        <>
                        {vaultData.pieces.map(piece => {
                          const isHiddenFromPortfolio = (vaultData.portfolio_hidden_ids || []).includes(piece.id);
                          return (
                          <div key={piece.id} className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <PieceCard piece={piece} hideAction onViewDetails={setSelectedPiece} t={t} priceLabel={getPiecePriceDisplay(piece, user).label} />
                              {isHiddenFromPortfolio ? (
                                <Button variant="ghost" className="text-xs text-zinc-500 hover:text-amber-500 w-fit" onClick={() => handleUnhideFromPortfolio(piece.id)}>{t('vault.show_in_portfolio_again')}</Button>
                              ) : (
                                <Button variant="ghost" className="text-xs text-zinc-500 hover:text-amber-500 w-fit" onClick={() => handleRemoveFromPortfolio(piece.id)}>{t('vault.remove_from_portfolio')}</Button>
                              )}
                            </div>
                            <WorkflowTimeline masterpieceId={piece.id} />
                          </div>
                          );
                        })}
                        {vaultData.pieces.length === 0 && <EmptyState icon={Award} text={t('vault.no_pieces')} />}
                        </>
                        )}
                      </div>
                    </div>
                  )}
                  {vaultTab === 'certs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vaultData.certs.map(cert => (
                        <Card key={cert.id} className="space-y-4">
                          <div className="aspect-video bg-zinc-800 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-12 h-12 text-amber-500/20" />
                          </div>
                          <div>
                            <h4 className="font-medium text-zinc-200">{cert.cert_id}</h4>
                            <p className="text-xs text-zinc-500">{t('issued')}: {new Date(cert.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 py-2 text-xs" onClick={() => setSelectedCert(cert)}><Eye className="w-3 h-3" /> {t('view')}</Button>
                            <Button variant="outline" className="flex-1 py-2 text-xs" onClick={() => {
                              const p = masterpieces.find(m => m.id === cert.masterpiece_id);
                              downloadPDF(t('cert.title'), cert.content, p, { contractType: 'certificate' });
                            }}><FileDown className="w-3 h-3" /> {t('common.pdf')}</Button>
                          </div>
                        </Card>
                      ))}
                      {vaultData.certs.length === 0 && <EmptyState icon={ShieldCheck} text={t('vault.no_certs')} />}
                    </div>
                  )}
                  {vaultTab === 'contracts' && (
                    <div className="space-y-6">
                      {vaultData.contracts.filter(c => c.status !== 'archived').map(contract => (
                        <Card key={contract.id} className="overflow-hidden border-zinc-800/50">
                          <div className="p-6 flex items-center justify-between bg-zinc-900/30">
                            <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${contract.status === 'signed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                <FileText className="w-7 h-7" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-serif italic text-lg text-zinc-100 capitalize">{contract.type} Agreement</h4>
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-zinc-700 text-zinc-500">v{contract.version}.0</Badge>
                                </div>
                                <p className="text-xs text-zinc-500 font-mono uppercase tracking-tighter">{contract.doc_ref}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {contract.status === 'draft' ? (
                                <Button variant="primary" className="py-2.5 px-6 text-xs font-bold uppercase tracking-widest" onClick={() => setContractToSign(contract)}>
                                  <Signature className="w-4 h-4" /> {t('accept_contract')}
                                </Button>
                              ) : null}
                              <Button variant="ghost" className="p-2 text-zinc-400 hover:text-amber-500" title="Vertrag als PDF herunterladen" onClick={() => {
                                const piece = contract.masterpiece_id
                                  ? (vaultData.pieces.find((p: Masterpiece) => p.id === contract.masterpiece_id) || masterpieces.find(m => m.id === contract.masterpiece_id))
                                  : undefined;
                                const title = (contract.type && typeof contract.type === 'string' ? contract.type : 'Contract') + ' Agreement';
                                const docRef = contract.doc_ref != null ? String(contract.doc_ref) : undefined;
                                const fileName = `Antonio-Bellanova-${docRef || `Vertrag-${contract.id}`}.pdf`;
                                downloadPDF(title, contract.content || '', piece, { docRef, fileName, contractType: contract.type });
                              }}><FileDown className="w-5 h-5" /></Button>
                              
                              {contract.status === 'signed' ? (
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                                    <CheckCircle className="w-4 h-4" /> {t('signed')}
                                  </div>
                                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest">{new Date(contract.signed_at!).toLocaleDateString()}</p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          
                          {/* Version History Mini-Timeline */}
                          <div className="px-6 py-3 bg-zinc-950/50 border-t border-zinc-800/30 flex items-center gap-4 overflow-x-auto scrollbar-hide">
                            <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">History:</span>
                            {[...Array(contract.version)].map((_, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${i + 1 === contract.version ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-zinc-800'}`} />
                                <span className={`text-[9px] font-mono ${i + 1 === contract.version ? 'text-zinc-300' : 'text-zinc-600'}`}>v{i + 1}.0</span>
                                {i < contract.version - 1 && <div className="w-4 h-[1px] bg-zinc-800" />}
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                      {vaultData.contracts.length === 0 && <EmptyState icon={FileText} text="No active agreements found." />}
                    </div>
                  )}
                  {vaultTab === 'resale' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {visiblePortfolioPieces.map(piece => (
                        <PieceCard 
                          key={piece.id} 
                          piece={piece} 
                          t={t}
                          priceLabel={getPiecePriceDisplay(piece, user).label}
                          hideAction 
                          onViewDetails={setSelectedPiece}
                          extraAction={
                            piece.transfer_type === 'external' || piece.warranty_void === 1 ? (
                              <div className="w-full mt-4 space-y-1">
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('resale.extern_transferred')}</div>
                                <div className="text-[10px] text-zinc-600">{t('resale.warranty_void')}</div>
                              </div>
                            ) : piece.status === 'sold' ? (
                              <div className="w-full mt-4 space-y-2">
                                <Button variant="outline" className="w-full py-2 text-xs" onClick={() => handleListResale(piece.id)}>
                                <TrendingUp className="w-4 h-4" /> {t('list_resale')}
                              </Button>
                                <button type="button" onClick={() => handleMarkExternal(piece.id)} className="w-full py-1.5 text-[10px] text-zinc-500 hover:text-zinc-400 uppercase tracking-wider">
                                  {t('resale.mark_external')}
                                </button>
                              </div>
                            ) : piece.status === 'resale_review' ? (
                              <div className="w-full py-2 text-center bg-zinc-800/50 rounded-lg text-zinc-400 text-[10px] mt-4 font-bold uppercase tracking-widest">
                                {t('resale_review')}
                              </div>
                            ) : piece.status === 'resell_pending' ? (
                              <div className="w-full py-2 text-center bg-zinc-800/50 rounded-lg text-amber-500 text-[10px] mt-4 font-bold uppercase tracking-widest">
                                {t('resale_pending_approval')}
                              </div>
                            ) : null
                          }
                        />
                      ))}
                      {visiblePortfolioPieces.length === 0 && <EmptyState icon={TrendingUp} text="No pieces available for resale." />}
                    </div>
                  )}
                  {vaultTab === 'service' && (
                    <Card className="max-w-lg p-6 space-y-4">
                      <h4 className="text-lg font-serif italic">Service anfragen</h4>
                      <p className="text-sm text-zinc-500">Stellen Sie eine Anfrage zu Restaurierung, Transport, Versicherung oder anderem.</p>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Stück (optional)</label>
                        <select value={serviceRequestForm.masterpieceId || ''} onChange={e => setServiceRequestForm(f => ({ ...f, masterpieceId: e.target.value ? Number(e.target.value) : '' }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm">
                          <option value="">— Kein bestimmtes Stück —</option>
                          {visiblePortfolioPieces.map((p: Masterpiece) => (
                            <option key={p.id} value={p.id}>{p.title} ({p.serial_id})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Typ</label>
                        <select value={serviceRequestForm.type} onChange={e => setServiceRequestForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm">
                          <option value="restoration">Restaurierung</option>
                          <option value="transport">Transport</option>
                          <option value="insurance">Versicherung</option>
                          <option value="other">Sonstiges</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Beschreibung</label>
                        <textarea value={serviceRequestForm.description} onChange={e => setServiceRequestForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurze Beschreibung Ihrer Anfrage…" rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm placeholder-zinc-600 resize-none" />
                      </div>
                      <Button variant="primary" className="w-full py-2.5 text-xs font-bold uppercase tracking-widest" onClick={async () => {
                        if (!user) return;
                        const r = await fetch('/api/service/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, masterpieceId: serviceRequestForm.masterpieceId || null, type: serviceRequestForm.type, description: serviceRequestForm.description || null }) });
                        if (r.ok) { notifyUser('Service-Anfrage gesendet.', 'success'); setServiceRequestForm({ masterpieceId: '', type: 'restoration', description: '' }); } else notifyUser('Fehler beim Senden.', 'error');
                      }}><Send className="w-4 h-4" /> Anfrage senden</Button>
                    </Card>
                  )}
                  {vaultTab === 'payments' && (
                    <div className="space-y-4">
                      {payments.map(pay => (
                        <Card key={pay.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pay.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-medium text-zinc-200">{pay.reference}</h4>
                              <p className="text-xs text-zinc-500">{pay.type === 'deposit' ? t('deposit') : t('full_payment')} • {new Date(pay.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-lg font-bold text-zinc-100">{pay.amount.toLocaleString()} €</p>
                            <Badge variant={pay.status === 'paid' ? 'emerald' : 'amber'}>{pay.status}</Badge>
                          </div>
                          {pay.status === 'pending' && (
                            <div className="ml-8 p-4 bg-zinc-900 rounded-xl border border-zinc-800 max-w-xs relative">
                              {vaultData.contracts.some(c => c.masterpiece_id === pay.masterpiece_id && c.status === 'draft') ? (
                                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 rounded-xl">
                                  <Lock className="w-5 h-5 text-amber-500 mb-2" />
                                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{t('signature_required')}</p>
                                  <p className="text-[8px] text-zinc-600 mt-1">Sign the agreement in the Contracts tab to unlock payment instructions.</p>
                                </div>
                              ) : null}
                              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Payment Instructions</p>
                              <p className="text-xs text-zinc-300 font-mono break-all">IBAN: {pay.iban}</p>
                              <p className="text-xs text-zinc-300 font-mono">REF: {pay.reference}</p>
                            </div>
                          )}
                        </Card>
                      ))}
                      {payments.length === 0 && <EmptyState icon={CreditCard} text="No payment history." />}
                    </div>
                  )}
                  {vaultTab === 'auctions' && (
                    <div className="space-y-4">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{t('my_bids')}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myBids.map((a: any) => (
                          <Card key={a.id} className="p-4 flex flex-col sm:flex-row gap-4">
                            {a.image_url && <img src={a.image_url} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-zinc-200 truncate">{a.title}</h4>
                              <p className="text-sm text-zinc-500 mt-1">Dein Gebot: {Number(a.my_bid_amount || 0).toLocaleString('de-DE')} €</p>
                              <p className="text-xs text-zinc-600">Aktuell: {Number(a.current_bid || 0).toLocaleString('de-DE')} €</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant={a.is_leading ? 'emerald' : 'amber'}>{a.is_leading ? 'Führend' : 'Überboten'}</Badge>
                                <Button variant="ghost" className="py-1 px-2 text-xs" onClick={() => { setView('auctions'); setVaultTab('pieces'); }}>{t('view')}</Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        {myBids.length === 0 && <EmptyState icon={Gavel} text="Keine aktiven Gebote." />}
                      </div>
                    </div>
                  )}
                  {vaultTab === 'vip' && (
                    <div className="space-y-8">
                      {user.role !== 'vip' ? (
                        <Card className="text-center py-12 space-y-4">
                          <Diamond className="w-12 h-12 text-zinc-800 mx-auto" />
                          <h4 className="text-xl font-serif italic">VIP Membership Required</h4>
                          <p className="text-zinc-500 max-w-md mx-auto">Exclusive benefits and concierge services are reserved for our VIP members. Apply for membership to unlock these features.</p>
                          <Button variant="outline" onClick={() => notifyUser(t('vip.contact_for_details'), 'success')}>{t('common.learn_more')}</Button>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <Card className="space-y-6 border-amber-500/30 bg-amber-500/5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                <Diamond className="w-6 h-6 text-amber-500" />
                              </div>
                              <div>
                                <h4 className="text-xl font-serif italic">VIP Exclusive Benefits</h4>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">Antonio Bellanova Atelier</p>
                              </div>
                            </div>
                            <ul className="space-y-4">
                              <BenefitItem icon={Clock} title={t('investor.early_access')} description={t('vip.benefit_early_access')} />
                              <BenefitItem icon={Award} title={t('vip.private_previews')} description={t('vip.benefit_previews')} />
                              <BenefitItem icon={ShieldCheck} title={t('vip.extended_warranty')} description={t('vip.benefit_warranty')} />
                              <BenefitItem icon={TrendingUp} title={t('vip.resale_priority')} description={t('vip.benefit_resale')} />
                            </ul>
                          </Card>

                          <Card className="space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-zinc-400" />
                              </div>
                              <div>
                                <h4 className="text-xl font-serif italic">{t('concierge.service_title')}</h4>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">{t('concierge.direct_access')}</p>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-400">{t('concierge.vip_description')}</p>
                            <div className="space-y-4">
                              <textarea 
                                id="concierge-msg"
                                placeholder={t('concierge.placeholder')} 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-amber-600/50 h-32 resize-none"
                              />
                              <Button className="w-full" onClick={() => {
                                const msg = (document.getElementById('concierge-msg') as HTMLTextAreaElement).value;
                                if (msg) handleConcierge(msg);
                              }}>{t('concierge.send_request')}</Button>
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}
                  {vaultTab === 'legacy' && (
                    <div className="space-y-8">
                      <Card className="p-6 space-y-6 border-amber-500/20">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-amber-500/90" />
                          </div>
                          <div>
                            <h4 className="text-xl font-serif italic">{t('vault.legacy_title') || 'Legacy & Begünstigte'}</h4>
                            <p className="text-xs text-zinc-500">{t('vault.legacy_subtitle') || 'Begünstigten anlegen und Nachfolge-Dokumentation hinterlegen. Die Freischaltung erfolgt nach Prüfung durch das Atelier.'}</p>
                          </div>
                        </div>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault(); if (!legacyForm.beneficiary_name.trim()) return; setLoading(true); try { const r = await fetch('/api/legacy/beneficiary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(legacyForm), credentials: 'include' }); if (r.ok) { notifyUser(t('vault.legacy_submitted') || 'Anfrage gesendet. Die Freigabe erfolgt nach Prüfung.', 'success'); setLegacyForm({ beneficiary_name: '', beneficiary_contact: '', transfer_protocol: '' }); fetch('/api/legacy/beneficiary', { credentials: 'include' }).then(res => res.ok && res.json().then(setClientLegacyRequests)); } else { const d = await r.json().catch(() => ({})); notifyUser(d.error || t('errors.generic'), 'error'); } } finally { setLoading(false); } }}>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{t('vault.legacy_beneficiary_name') || 'Name des Begünstigten'}</label>
                            <input value={legacyForm.beneficiary_name} onChange={e => setLegacyForm(f => ({ ...f, beneficiary_name: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-200 text-sm" placeholder="Vollständiger Name" required />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{t('vault.legacy_beneficiary_contact') || 'Kontakt (E-Mail oder Telefon)'}</label>
                            <input value={legacyForm.beneficiary_contact} onChange={e => setLegacyForm(f => ({ ...f, beneficiary_contact: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-200 text-sm" placeholder="Optional" />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{t('vault.legacy_transfer_protocol') || 'Übertragungsprotokoll / Hinweise'}</label>
                            <textarea value={legacyForm.transfer_protocol} onChange={e => setLegacyForm(f => ({ ...f, transfer_protocol: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-200 text-sm h-24 resize-none" placeholder="Optionale Angaben zur geplanten Übertragung" />
                          </div>
                          <Button type="submit" className="md:col-span-2" disabled={loading}>{t('vault.legacy_submit') || 'Anfrage einreichen'}</Button>
                        </form>
                      </Card>
                      {clientLegacyRequests.length > 0 && (
                        <Card className="p-4">
                          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">{t('vault.legacy_my_requests') || 'Ihre Legacy-Anfragen'}</h4>
                          <ul className="space-y-3">
                            {clientLegacyRequests.map((lr: any) => (
                              <li key={lr.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-zinc-800/50 last:border-0">
                                <span className="text-zinc-300">{lr.beneficiary_name}</span>
                                <Badge variant={lr.status === 'approved' ? 'emerald' : lr.status === 'rejected' ? 'red' : 'amber'}>{lr.status === 'pending' ? (t('vault.legacy_pending') || 'Ausstehend') : lr.status === 'approved' ? (t('vault.legacy_approved') || 'Freigegeben') : (t('vault.legacy_rejected') || 'Abgelehnt')}</Badge>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'portfolio' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <h3 className="text-5xl font-serif italic text-white">{t('portfolio.curated_title')}</h3>
                  <p className="text-zinc-500 text-lg">{t('portfolio.curated_subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center items-center">
                  <input type="text" placeholder={t('marketplace.filter_placeholder')} value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-4 text-zinc-200 text-sm w-48 md:w-64" />
                  <select value={filterRarity} onChange={e => setFilterRarity(e.target.value)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm">
                    <option value="">Alle Rarity</option>
                    <option value="Unikat">Unikat</option>
                    <option value="Limitiert">Limitiert</option>
                    <option value="Selten">Selten</option>
                  </select>
                  <Button variant="outline" className="text-xs" onClick={() => {
                    const doc = new jsPDF();
                    doc.setFontSize(18);
                    doc.text('Antonio Bellanova — Portfolio', 20, 22);
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.text(new Date().toLocaleDateString('de-DE'), 20, 30);
                    const list = filterMasterpieces(masterpieces);
                    let y = 42;
                    list.slice(0, 25).forEach((p: Masterpiece, i: number) => {
                      doc.setFontSize(10);
                      doc.setTextColor(0, 0, 0);
                      doc.text(`${i + 1}. ${(p.title || '').substring(0, 40)}`, 20, y);
                      doc.text(`${p.serial_id || '—'} · ${(p.valuation != null ? Number(p.valuation).toLocaleString('de-DE') + ' €' : '—')}`, 120, y);
                      y += 8;
                    });
                    if (list.length > 25) doc.text(`… und ${list.length - 25} weitere`, 20, y);
                    doc.save('Antonio-Bellanova-Portfolio.pdf');
                  }}>{t('vault.portfolio_pdf_btn')}</Button>
                </div>

                {user && vaultData.pieces.length > 0 && (
                  <Card className="p-6 border-amber-500/20 bg-amber-500/5">
                    <h4 className="text-lg font-serif italic text-amber-500/90 mb-4">{t('vault.your_pieces')}</h4>
                    <p className="text-sm text-zinc-500 mb-4">{t('vault.your_pieces_desc')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {visiblePortfolioPieces.map(piece => (
                        <div key={piece.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                          {piece.image_url ? <img src={piece.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-200 truncate">{piece.title}</p>
                            <p className="text-xs text-zinc-500">{piece.serial_id}</p>
                          </div>
                          <Button variant="ghost" className="text-xs text-zinc-500 hover:text-amber-500 shrink-0" onClick={(e) => { e.stopPropagation(); handleRemoveFromPortfolio(piece.id); }}>{t('vault.remove_from_portfolio')}</Button>
                        </div>
                      ))}
                    </div>
                    {hiddenPortfolioPieces.length > 0 && (
                      <div className="pt-4 border-t border-zinc-800/50">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Ausgeblendet</p>
                        <ul className="space-y-2">
                          {hiddenPortfolioPieces.map(p => (
                            <li key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                              <span className="text-sm text-zinc-400 truncate">{p.title} ({p.serial_id})</span>
                              <Button variant="outline" className="text-xs shrink-0" onClick={() => handleUnhideFromPortfolio(p.id)}>Wieder anzeigen</Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {filterMasterpieces(masterpieces).map(piece => {
                    const isOwnPiece = user && piece.current_owner_id === user.id;
                    const isHiddenFromPortfolio = (vaultData.portfolio_hidden_ids || []).includes(piece.id);
                    const canRemoveFromPortfolio = isOwnPiece && !isHiddenFromPortfolio;
                    const canShowAgain = isOwnPiece && isHiddenFromPortfolio;
                    return (
                    <div key={piece.id} className="group cursor-pointer" onClick={() => setSelectedPiece(piece)}>
                      <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-zinc-900 mb-6 relative">
                        <img 
                          src={piece.image_url || `https://picsum.photos/seed/${piece.id}/800/1200`} 
                          alt={piece.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 gap-3">
                          <p className="text-white text-sm font-serif italic">{piece.description.substring(0, 100)}...</p>
                          {canRemoveFromPortfolio && (
                            <Button variant="outline" size="sm" className="w-fit text-xs border-zinc-600 text-zinc-200 hover:border-amber-500 hover:text-amber-400" onClick={(e) => { e.stopPropagation(); handleRemoveFromPortfolio(piece.id); }}>{t('vault.remove_from_portfolio')}</Button>
                          )}
                          {canShowAgain && (
                            <Button variant="outline" size="sm" className="w-fit text-xs border-zinc-600 text-zinc-200 hover:border-amber-500 hover:text-amber-400" onClick={(e) => { e.stopPropagation(); handleUnhideFromPortfolio(piece.id); }}>{t('vault.show_in_portfolio_again')}</Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-2xl font-serif italic text-white">{piece.title}</h4>
                          <Badge variant="outline" className="border-zinc-800 text-zinc-500">{piece.category}</Badge>
                        </div>
                        <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">{getRarityLabel(piece.rarity)} {t('piece.edition')}</p>
                        {canRemoveFromPortfolio && (
                          <Button variant="ghost" className="text-xs text-zinc-500 hover:text-amber-500 -ml-1 p-0 h-auto" onClick={(e) => { e.stopPropagation(); handleRemoveFromPortfolio(piece.id); }}>{t('vault.remove_from_portfolio')}</Button>
                        )}
                        {canShowAgain && (
                          <Button variant="ghost" className="text-xs text-zinc-500 hover:text-amber-500 -ml-1 p-0 h-auto" onClick={(e) => { e.stopPropagation(); handleUnhideFromPortfolio(piece.id); }}>{t('vault.show_in_portfolio_again')}</Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {view === 'fractional' && user.role !== UserRole.ADMIN && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <Card className="p-6">
                  <h3 className="text-xl font-serif italic mb-4">{t('investor.fractional_offers')}</h3>
                  {fractionalOffers.length === 0 ? (
                    <p className="text-zinc-500 text-sm italic">{t('investor.no_fractional_offers')}</p>
                  ) : (
                    <div className="space-y-4">
                      {fractionalOffers.map((off: any) => (
                        <div key={off.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200">{off.title}</p>
                            <p className="text-xs text-zinc-500">Verfügbar: {Number(off.available_pct || 0).toFixed(0)}% {off.price_per_pct != null ? ` · ${Number(off.price_per_pct).toLocaleString('de-DE')} €/%` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="number" min={1} max={Math.min(100, off.available_pct || 100)} value={shareRequestForm.masterpieceId === off.id ? shareRequestForm.percentage : 5} onChange={(e) => setShareRequestForm(f => ({ ...f, masterpieceId: off.id, percentage: Math.min(100, Math.max(1, Number(e.target.value) || 5)) }))} className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg py-2 px-2 text-zinc-200 text-sm" />
                            <span className="text-zinc-500 text-xs">%</span>
                            <Button variant="primary" className="py-2 px-4 text-sm" onClick={() => handleInvestorRequest('share', t('investor.request_share'), off.id, shareRequestForm.masterpieceId === off.id ? shareRequestForm.percentage : 5)} disabled={loading}>{t('investor.request_share_pct')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
                  )}
                </Card>
              </motion.div>
            )}

            {view === 'advisor' && user.role === UserRole.STRATEGIC_PRIVATE_ADVISOR && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {advisorNotActivated && (
                  <Card className="p-6 border-amber-500/30 bg-amber-500/10">
                    <p className="text-amber-200 font-medium">{t('advisor.not_activated_title') || 'Zugang noch nicht freigeschaltet'}</p>
                    <p className="text-sm text-zinc-400 mt-2">{t('advisor.not_activated_message') || 'Bitte unterzeichnen Sie zuerst den NDA unter Verträge und warten Sie auf die Freischaltung durch den Administrator.'}</p>
                  </Card>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Card className="p-5 border-amber-500/20 bg-amber-500/5" hoverGlow>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{t('advisor.referred_clients')}</p>
                    <p className="text-2xl font-bold text-amber-500">{advisorDashboard?.totalReferredClients ?? 0}</p>
                  </Card>
                  <Card className="p-5" hoverGlow>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{t('advisor.active_deals')}</p>
                    <p className="text-2xl font-bold text-zinc-100">{advisorDashboard?.activeDeals ?? 0}</p>
                  </Card>
                  <Card className="p-5" hoverGlow>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{t('advisor.closed_deals')}</p>
                    <p className="text-2xl font-bold text-zinc-100">{advisorDashboard?.closedDeals ?? 0}</p>
                  </Card>
                  <Card className="p-5 border-amber-500/20" hoverGlow>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{t('advisor.pending_commission')}</p>
                    <p className="text-2xl font-bold text-amber-500">{(advisorDashboard?.pendingCommission ?? 0).toLocaleString('de-DE')} €</p>
                  </Card>
                  <Card className="p-5 border-emerald-500/20 bg-emerald-500/5" hoverGlow>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{t('advisor.paid_commission')}</p>
                    <p className="text-2xl font-bold text-emerald-500">{(advisorDashboard?.paidCommission ?? 0).toLocaleString('de-DE')} €</p>
                  </Card>
                </div>
                <div className="flex gap-2 border-b border-zinc-800 pb-4">
                  <TabButton active={advisorTab === 'dashboard'} label={t('advisor.overview')} onClick={() => setAdvisorTab('dashboard')} icon={TrendingUp} />
                  <TabButton active={advisorTab === 'clients'} label={t('advisor.clients')} onClick={() => setAdvisorTab('clients')} icon={Users} />
                  <TabButton active={advisorTab === 'commissions'} label={t('advisor.commissions')} onClick={() => setAdvisorTab('commissions')} icon={CreditCard} />
                  <TabButton active={advisorTab === 'contracts'} label={t('advisor.contracts')} onClick={() => setAdvisorTab('contracts')} icon={FileText} />
                </div>
                {advisorTab === 'clients' && (
                  <Card className="p-6 space-y-4">
                    <h4 className="text-lg font-serif italic">{t('advisor.my_clients')}</h4>
                    <div className="flex gap-3 flex-wrap">
                      <input type="email" placeholder={t('advisor.add_client_email')} value={advisorNewClientEmail} onChange={(e: any) => setAdvisorNewClientEmail(e.target.value)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-4 text-zinc-200 text-sm w-64" />
                      <Button variant="primary" className="text-sm" onClick={async () => {
                        if (!advisorNewClientEmail.trim()) return;
                        const res = await fetch('/api/advisor/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: advisorNewClientEmail.trim() }), credentials: 'include' });
                        const data = await res.json().catch(() => ({}));
                        if (res.ok) { notifyUser(t('advisor.client_linked') || 'Client linked.'); setAdvisorNewClientEmail(''); fetchData(); } else notifyUser(data.error || 'Error', 'error');
                      }}>{t('advisor.link_client')}</Button>
                    </div>
                    <div className="space-y-2">
                      {advisorClients.map((c: any) => (
                        <div key={c.id} className="flex justify-between items-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                          <div>
                            <p className="font-medium text-zinc-200">{c.name}</p>
                            <p className="text-xs text-zinc-500">{c.email}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={async () => {
                            const res = await fetch(`/api/advisor/clients/${c.id}`, { method: 'DELETE', credentials: 'include' });
                            if (res.ok) fetchData();
                          }}>{t('cancel')}</Button>
                        </div>
                      ))}
                      {advisorClients.length === 0 && <p className="text-sm text-zinc-500 italic">{t('advisor.no_clients')}</p>}
                    </div>
                  </Card>
                )}
                {advisorTab === 'commissions' && (
                  <Card className="p-6 overflow-x-auto">
                    <h4 className="text-lg font-serif italic mb-4">{t('advisor.commissions')}</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-zinc-500 border-b border-zinc-800">
                          <th className="py-2 pr-4">{t('advisor.piece')}</th>
                          <th className="py-2 pr-4">{t('advisor.client_name')}</th>
                          <th className="py-2 pr-4">{t('advisor.sale_amount')}</th>
                          <th className="py-2 pr-4">{t('advisor.commission_pct')}</th>
                          <th className="py-2 pr-4">{t('advisor.commission_amount')}</th>
                          <th className="py-2">{t('advisor.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advisorCommissions.map((c: any) => (
                          <tr key={c.id} className="border-b border-zinc-800/50">
                            <td className="py-3 pr-4 text-zinc-200">{c.masterpiece_title || c.masterpiece_id}</td>
                            <td className="py-3 pr-4 text-zinc-400">{c.client_name}</td>
                            <td className="py-3 pr-4">{Number(c.sale_amount).toLocaleString('de-DE')} €</td>
                            <td className="py-3 pr-4">{c.commission_pct}%</td>
                            <td className="py-3 pr-4 text-amber-500">{Number(c.commission_amount).toLocaleString('de-DE')} €</td>
                            <td className="py-3"><Badge variant={c.status === 'paid_out' ? 'emerald' : c.status === 'confirmed' ? 'amber' : 'zinc'}>{c.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {advisorCommissions.length === 0 && <p className="text-sm text-zinc-500 italic py-4">{t('advisor.no_commissions')}</p>}
                  </Card>
                )}
                {advisorTab === 'contracts' && (
                  <Card className="p-6 space-y-4">
                    <h4 className="text-lg font-serif italic">{t('advisor.contracts')}</h4>
                    <p className="text-sm text-zinc-500">{t('advisor.contracts_download_hint') || 'Verträge herunterladen, prüfen und anschließend unterzeichnen.'}</p>
                    {['nda', 'advisor_agreement', 'commission_agreement'].map((type: string) => {
                      const c = advisorContracts.find((x: any) => x.type === type);
                      const typeLabel = type === 'nda' ? 'NDA (Vertraulichkeit)' : type === 'advisor_agreement' ? t('advisor.advisor_agreement') || 'Rahmenvereinbarung' : t('advisor.commission_agreement') || 'Provisionsvereinbarung';
                      return (
                        <div key={type} className="flex flex-wrap justify-between items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                          <div>
                            <p className="font-medium text-zinc-200">{typeLabel}</p>
                            <p className="text-xs text-zinc-500">{c?.signed_at ? t('signed') + ': ' + new Date(c.signed_at).toLocaleDateString() : t('advisor.unsigned')}</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={async () => {
                              try {
                                const res = await fetch(`/api/advisor/contracts/${type}/content`, { credentials: 'include' });
                                const data = await res.json().catch(() => ({}));
                                const title = data.title && String(data.title).trim();
                                let content = data.content != null ? String(data.content) : '';
                                if (!res.ok || !title) {
                                  notifyUser(data.error || (t('advisor.download_error') || 'Download fehlgeschlagen.'), 'error');
                                  return;
                                }
                                if (content.length === 0) {
                                  notifyUser(t('advisor.download_error') || 'Download fehlgeschlagen.', 'error');
                                  return;
                                }
                                // Normalize for jsPDF (Unicode quotes can break default font)
                                content = content.replace(/[\u201C\u201D\u201E\u201F„"]/g, '"').replace(/\u2018|\u2019/g, "'");
                                await downloadPDF(title, content, undefined, { fileName: `Antonio-Bellanova-${type}.pdf` });
                                notifyUser(t('advisor.download_ok') || 'Vertrag heruntergeladen.', 'success');
                              } catch (e) { notifyUser(t('advisor.download_error') || 'Download fehlgeschlagen.', 'error'); }
                            }}>{t('advisor.download_contract') || 'Herunterladen'}</Button>
                            {c?.status === 'signed' ? (
                              <Badge variant="emerald">{t('signed')}</Badge>
                            ) : (
                              <Button variant="primary" size="sm" onClick={async () => {
                                const res = await fetch(`/api/advisor/contracts/${type}/sign`, { method: 'POST', credentials: 'include' });
                                if (res.ok) fetchData();
                              }}>{t('sign_contract')}</Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                )}
                {advisorTab === 'dashboard' && (
                  <Card className="p-6 space-y-6">
                    <p className="text-zinc-300">{t('advisor.welcome_message') || 'Ihre Übersicht: verwaltete Kunden, Deals und Provisionen. Jurisdiction: Germany, unless otherwise agreed.'}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t('advisor.referred_clients')}</p>
                        <p className="text-xl font-bold text-amber-500">{advisorDashboard?.totalReferredClients ?? 0}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t('advisor.pending_commission')}</p>
                        <p className="text-xl font-bold text-amber-500">{(advisorDashboard?.pendingCommission ?? 0).toLocaleString('de-DE')} €</p>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-900/50 border border-emerald-800/50">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t('advisor.paid_commission')}</p>
                        <p className="text-xl font-bold text-emerald-500">{(advisorDashboard?.paidCommission ?? 0).toLocaleString('de-DE')} €</p>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {view === 'investor' && user.role === UserRole.INVESTOR && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card className="p-6 space-y-2 border-emerald-500/20 bg-emerald-500/5">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Platform Valuation</p>
                    <p className="text-3xl font-bold text-emerald-500">{investorAnalytics?.platform_valuation.toLocaleString()} €</p>
                    <p className="text-[10px] text-emerald-600 font-bold">+12.4% vs Last Quarter</p>
                  </Card>
                  <Card className="p-6 space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Liquidity Forecast</p>
                    <p className="text-3xl font-bold text-zinc-100">{investorAnalytics?.liquidity_forecast.toLocaleString()} €</p>
                    <p className="text-[10px] text-zinc-500">Projected Secondary Market Volume</p>
                  </Card>
                  <Card className="p-6 space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Scarcity Index</p>
                    <p className="text-3xl font-bold text-amber-500">{investorAnalytics?.scarcity_index}/100</p>
                    <p className="text-[10px] text-amber-600 font-bold">High Demand Signal</p>
                  </Card>
                  <Card className="p-6 space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Pieces Under Management</p>
                    <p className="text-3xl font-bold text-zinc-100">{masterpieces.length}</p>
                    <p className="text-[10px] text-zinc-500">{investorAnalytics?.pieces_sold} Sold to Date</p>
                  </Card>
                </div>

                {investorPortfolio && investorPortfolio.shares.length > 0 && (
                  <Card className="p-6">
                    <h4 className="text-lg font-serif italic mb-4">{t('investor.my_shares')}</h4>
                    <div className="space-y-3">
                      {investorPortfolio.shares.map((s: any) => (
                        <div key={s.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                          <div>
                            <p className="text-sm font-medium text-zinc-200">{s.title}</p>
                            <p className="text-xs text-zinc-500">{s.serial_id} · {s.percentage}%</p>
                          </div>
                          <p className="text-amber-500 font-bold">{s.valuation != null ? (Number(s.valuation) * s.percentage / 100).toLocaleString('de-DE') : '—'} €</p>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm">
                        <span className="text-zinc-500">{t('investor.total_value_shares')}</span>
                        <span className="text-amber-500 font-bold">{Number(investorPortfolio.total_fractional_value || 0).toLocaleString('de-DE')} €</span>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-serif italic">{t('investor.market_performance')}</h4>
                      <div className="flex gap-2">
                        <TabButton active={vaultTab === 'investor_insights'} label={t('investor.insights')} onClick={() => setVaultTab('investor_insights')} icon={TrendingUp} />
                        <TabButton active={vaultTab === 'dataroom'} label={t('investor.dataroom')} onClick={() => setVaultTab('dataroom')} icon={Lock} />
                      </div>
                    </div>

                    {vaultTab === 'investor_insights' ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Top Category</p>
                            <p className="text-lg font-medium text-zinc-200">{investorAnalytics?.appreciation_metrics.top_performing_category}</p>
                          </div>
                          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Avg. Appreciation</p>
                            <p className="text-lg font-medium text-emerald-500">+{investorAnalytics?.appreciation_metrics.avg_appreciation}%</p>
                          </div>
                        </div>
                        <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                          <h5 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Rarity Distribution</h5>
                          <div className="space-y-3">
                            {Object.entries(investorAnalytics?.rarity_distribution || {}).map(([key, val]: any) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-zinc-500">{key}</span>
                                  <span className="text-zinc-300">{val} Pieces</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500" style={{ width: `${(val / masterpieces.length) * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : investorRequests.some((r: any) => r.type === 'dataroom' && r.status === 'approved') ? (
                      <div className="space-y-6">
                        <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Zugang gewährt</p>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Stück wählen</label>
                          <select value={dataroomPieceId} onChange={async (e) => {
                            const id = e.target.value ? Number(e.target.value) : '';
                            setDataroomPieceId(id);
                            if (id) {
                              const r = await fetch(`/api/investor/dataroom/${id}`);
                              if (r.ok) setDataroomContent(await r.json());
                            } else setDataroomContent(null);
                          }} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm">
                            <option value="">—</option>
                            {masterpieces.slice(0, 50).map(p => (
                              <option key={p.id} value={p.id}>{p.title} ({p.serial_id})</option>
                            ))}
                          </select>
                        </div>
                        {dataroomContent && (
                          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4 text-left">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="text-sm font-bold text-zinc-300">{dataroomContent.masterpiece?.title}</h5>
                                <p className="text-xs text-zinc-500">Bewertung: {dataroomContent.masterpiece?.valuation != null ? Number(dataroomContent.masterpiece.valuation).toLocaleString('de-DE') + ' €' : '—'}</p>
                              </div>
                              <Button variant="outline" size="sm" className="shrink-0" onClick={() => {
                                const doc = new jsPDF();
                                const pageWidth = doc.internal.pageSize.getWidth();
                                const pageHeight = doc.internal.pageSize.getHeight();
                                const margin = 24;
                                doc.setFillColor(18, 18, 18);
                                doc.rect(0, 0, pageWidth, pageHeight, 'F');
                                doc.setTextColor(180, 140, 60);
                                doc.setFontSize(8);
                                doc.text('CONFIDENTIAL – Investor Data Room', pageWidth / 2, 20, { align: 'center' });
                                if (user?.name || user?.email) doc.text(`For ${user?.name || user?.email} only`, pageWidth / 2, 26, { align: 'center' });
                                doc.setDrawColor(180, 140, 60);
                                doc.setLineWidth(0.2);
                                doc.line(margin, 30, pageWidth - margin, 30);
                                doc.setTextColor(220, 220, 220);
                                doc.setFontSize(12);
                                doc.text(dataroomContent.masterpiece?.title || 'Data Room', margin, 44);
                                doc.setFontSize(9);
                                doc.text(`Serial: ${dataroomContent.masterpiece?.serial_id || '—'}  |  Valuation: ${dataroomContent.masterpiece?.valuation != null ? Number(dataroomContent.masterpiece.valuation).toLocaleString('de-DE') + ' €' : '—'}`, margin, 52);
                                let y = 62;
                                doc.text(`Ownership history entries: ${dataroomContent.ownership_history?.length ?? 0}`, margin, y); y += 7;
                                doc.text(`Contracts: ${dataroomContent.contracts?.length ?? 0}`, margin, y); y += 7;
                                doc.text(`Service history entries: ${dataroomContent.service_history?.length ?? 0}`, margin, y);
                                doc.setFontSize(7);
                                doc.setTextColor(120, 120, 120);
                                doc.text('This document is confidential. Not for distribution.', pageWidth / 2, pageHeight - 15, { align: 'center' });
                                doc.setFontSize(20);
                                doc.setTextColor(40, 40, 40);
                                doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
                                doc.save(`Data-Room-${dataroomContent.masterpiece?.serial_id || dataroomContent.masterpiece?.id || 'export'}-${new Date().toISOString().slice(0, 10)}.pdf`);
                              }}>
                                <Download className="w-3 h-3" /> {t('vault.portfolio_pdf')}
                              </Button>
                            </div>
                            {(dataroomContent.ownership_history?.length > 0 || dataroomContent.contracts?.length > 0) && (
                              <>
                                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Besitzhistorie / Verträge</p>
                                <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                  {JSON.stringify({ ownership_history: dataroomContent.ownership_history?.length ?? 0, contracts: dataroomContent.contracts?.length ?? 0, service_history: dataroomContent.service_history?.length ?? 0 }, null, 2)}
                                </pre>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-12 text-center space-y-4 border border-dashed border-zinc-800 rounded-3xl">
                          <Lock className="w-12 h-12 text-zinc-800 mx-auto" />
                          <h5 className="text-lg font-serif italic">Restricted Data Room</h5>
                          <p className="text-sm text-zinc-500 max-w-xs mx-auto">Access to detailed financial reports, production pipelines, and brand audits requires specific authorization.</p>
                          <Button variant="primary" onClick={() => handleInvestorRequest('dataroom', t('investor.request_access'))}>{t('investor.request_access')}</Button>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="space-y-6">
                    <h4 className="text-xl font-serif italic">Investor Actions</h4>
                    <div className="space-y-3">
                      <InvestorActionButton icon={Diamond} title={t('investor.request_allocation')} description={t('investor.request_allocation_desc')} onClick={() => handleInvestorRequest('allocation', t('investor.request_allocation'))} />
                      <InvestorActionButton icon={Users} title={t('investor.schedule_meeting')} description={t('investor.schedule_meeting_desc')} onClick={() => handleInvestorRequest('meeting', t('investor.schedule_meeting'))} />
                      <InvestorActionButton icon={Eye} title={t('investor.vip_preview')} description={t('investor.vip_preview_desc')} onClick={() => handleInvestorRequest('preview', t('investor.vip_preview'))} />
                    </div>
                    <div className="pt-4 border-t border-zinc-900 space-y-4">
                      <h5 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('investor.fractional_offers')}</h5>
                      {fractionalOffers.length === 0 ? (
                        <p className="text-zinc-500 text-sm italic">{t('investor.no_fractional_offers')}</p>
                      ) : (
                        <div className="space-y-3">
                          {fractionalOffers.map((off: any) => (
                            <div key={off.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-200 truncate">{off.title}</p>
                                <p className="text-xs text-zinc-500">Verfügbar: {Number(off.available_pct || 0).toFixed(0)}% {off.price_per_pct != null ? ` · ${Number(off.price_per_pct).toLocaleString('de-DE')} €/%` : ''}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="number" min={1} max={Math.min(100, off.available_pct || 100)} value={shareRequestForm.masterpieceId === off.id ? shareRequestForm.percentage : 5} onChange={(e) => setShareRequestForm(f => ({ ...f, masterpieceId: off.id, percentage: Math.min(100, Math.max(1, Number(e.target.value) || 5)) }))} className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg py-1.5 px-2 text-zinc-200 text-sm" />
                                <span className="text-zinc-500 text-xs">%</span>
                                <Button variant="primary" className="py-1.5 px-3 text-xs" onClick={() => handleInvestorRequest('share', t('investor.request_share'), off.id, shareRequestForm.masterpieceId === off.id ? shareRequestForm.percentage : 5)} disabled={loading}>{t('investor.request_share_pct')}</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-zinc-900 space-y-2">
                      <h5 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Exit-Simulation</h5>
                      <select className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3 text-zinc-200 text-sm" onChange={async (e) => {
                        const id = e.target.value ? Number(e.target.value) : '';
                        if (id && user) {
                          const r = await fetch(`/api/investor/exit-simulation?userId=${user.id}&masterpieceId=${id}`);
                          if (r.ok) setExitSimulation(await r.json());
                        } else setExitSimulation(null);
                      }}>
                        <option value="">Stück wählen</option>
                        {masterpieces.slice(0, 30).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                      {exitSimulation && (
                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                          <p className="text-zinc-400">{exitSimulation.title}</p>
                          <p className="text-amber-500 font-bold mt-1">Geschätzer Exit-Wert: {Number(exitSimulation.estimated_exit_value || 0).toLocaleString('de-DE')} €</p>
                          <p className="text-zinc-500">Bewertung: {Number(exitSimulation.valuation || 0).toLocaleString('de-DE')} € · Anteil: {exitSimulation.share_pct}%</p>
                        </div>
                      )}
                    </div>
                    <div className="pt-6 border-t border-zinc-900">
                      <h5 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Recent Activity</h5>
                      <div className="space-y-4">
                        {(user.role === UserRole.ADMIN ? adminInvestorRequests.filter((r: any) => r.user_id === user.id) : investorRequests).slice(0, 3).map((req: any) => (
                          <div key={req.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div>
                              <p className="text-xs text-zinc-300 capitalize">{req.type} Request</p>
                              <p className="text-[10px] text-zinc-600">{new Date(req.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant="outline" className="ml-auto text-[8px] h-fit">{req.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {view === 'admin' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
                  {(['overview', 'inventory', 'users', 'resale', 'appointments', 'advisors', 'intelligence', 'legacy', 'settings'] as const).map(tab => (
                    <button key={tab} type="button" onClick={() => setAdminTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wider transition-colors ${adminTab === tab ? 'bg-amber-600/20 text-amber-500 border border-amber-600/40' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>
                      {tab === 'overview' ? t('admin.tab_overview') : tab === 'inventory' ? t('admin.tab_inventory') : tab === 'users' ? t('admin.tab_users') : tab === 'resale' ? t('admin.tab_resale') : tab === 'appointments' ? t('admin.tab_appointments') : tab === 'advisors' ? (t('admin.advisors') || 'Advisors') : tab === 'intelligence' ? t('admin.tab_intelligence') : tab === 'legacy' ? t('admin.tab_legacy') : t('admin.tab_settings')}
                    </button>
                  ))}
                </div>
                {(adminTab === 'overview') && (
                <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">{t('admin.stat_revenue')}</p><p className="text-3xl font-bold text-amber-500">{adminStats?.totalRevenue?.toLocaleString?.() ?? 0} €</p></Card>
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">{t('admin.stat_active_users')}</p><p className="text-3xl font-bold text-zinc-100">{adminStats?.activeUsers ?? 0}</p></Card>
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">{t('admin.stat_pending_approvals')}</p><p className="text-3xl font-bold text-zinc-100">{adminStats?.pendingApprovals ?? 0}</p></Card>
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">{t('admin.stat_masterpieces')}</p><p className="text-3xl font-bold text-zinc-100">{masterpieces.length}</p></Card>
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">{t('admin.stat_views')}</p><p className="text-3xl font-bold text-zinc-100">{adminStats?.pieceViewsTotal ?? 0}</p></Card>
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">{t('admin.stat_contact_requests')}</p><p className="text-3xl font-bold text-zinc-100">{adminStats?.contactRequestsCount ?? 0}</p><p className="text-[10px] text-zinc-500 mt-1">{t('admin.stat_last_30_days')}: {adminStats?.contactRequestsLast30Days ?? 0}</p></Card>
                </div>
                {Array.isArray(adminStats?.popularPieces) && adminStats.popularPieces.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-serif italic text-amber-500/90 mb-3">{t('admin.popular_pieces_title')}</h3>
                    <ul className="space-y-2 text-sm">
                      {adminStats.popularPieces.slice(0, 5).map((p: any) => (
                        <li key={p.masterpiece_id} className="flex justify-between items-center">
                          <span className="text-zinc-300 truncate">{p.title || p.serial_id || p.masterpiece_id}</span>
                          <span className="text-zinc-500 shrink-0 ml-2">{p.views ?? 0} {t('common.views')} · {p.favorites ?? 0} {t('dashboard.favorites')}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Offene Aufgaben */}
                <Card className="p-4 border-amber-500/20 bg-amber-500/5">
                  <h3 className="text-sm font-serif italic text-amber-500/90 mb-3">{t('admin.open_tasks')}</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-zinc-400">{t('admin.user_approvals')}: <strong className="text-zinc-200">{allUsers.filter(u => u.status === 'pending').length}</strong></span>
                    <span className="text-zinc-400">{t('admin.pending_payments')}: <strong className="text-zinc-200">{adminStats?.pendingPayments ?? 0}</strong></span>
                    <span className="text-zinc-400">{t('admin.resale_no_decision')}: <strong className="text-zinc-200">{adminResaleListings.filter((r: any) => ['signed', 'resale_pending'].includes(r.status) && !r.admin_decision).length}</strong></span>
                    <span className="text-zinc-400">{t('admin.investor_requests')}: <strong className="text-zinc-200">{adminInvestorRequests.filter((r: any) => r.status === 'pending').length}</strong></span>
                    <span className="text-zinc-400">{t('admin.appointments_proposed')}: <strong className="text-zinc-200">{adminAppointments.filter(a => a.status === 'proposed').length}</strong></span>
                  </div>
                </Card>

                {/* Atelier-Momente */}
                <Card className="p-6 space-y-6">
                  <h3 className="text-xl font-serif italic text-amber-500/90">{t('admin.atelier_moments')}</h3>
                  <p className="text-sm text-zinc-500">{t('admin.atelier_moments_desc')}</p>
                  <div className="grid gap-4 max-w-2xl">
                    <input type="text" placeholder={t('admin.field_title')} value={adminAtelierForm.title} onChange={e => setAdminAtelierForm(f => ({ ...f, title: e.target.value }))} className="input" />
                    <input type="text" placeholder={t('admin.field_subtitle')} value={adminAtelierForm.subtitle} onChange={e => setAdminAtelierForm(f => ({ ...f, subtitle: e.target.value }))} className="input" />
                    <input type="text" placeholder={t('admin.field_image_url')} value={adminAtelierForm.image_url} onChange={e => setAdminAtelierForm(f => ({ ...f, image_url: e.target.value }))} className="input" />
                    <textarea placeholder={t('admin.field_body_optional')} value={adminAtelierForm.body} onChange={e => setAdminAtelierForm(f => ({ ...f, body: e.target.value }))} className="input min-h-[80px]" />
                    <div className="flex gap-3">
                      <Button variant="secondary" className="text-sm" onClick={() => { if (adminAtelierForm.title.trim()) { setAdminAtelierMoments(prev => [...prev, { id: `new-${Date.now()}`, title: adminAtelierForm.title.trim(), subtitle: adminAtelierForm.subtitle.trim() || undefined, image_url: adminAtelierForm.image_url.trim() || undefined, body: adminAtelierForm.body.trim() || undefined }]); setAdminAtelierForm({ title: '', subtitle: '', image_url: '', body: '' }); } }}>{t('admin.add_button')}</Button>
                      <Button variant="primary" className="text-sm" disabled={adminAtelierSaving} onClick={async () => {
                        setAdminAtelierSaving(true);
                        try {
                          const res = await fetch('/api/admin/atelier-moments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminAtelierMoments.map(({ id, ...r }) => r)) });
                          if (res.ok) { const data = await fetch('/api/atelier-moments').then(r => r.json()); setAtelierMoments(data); setAdminAtelierMoments(data); }
                        } finally { setAdminAtelierSaving(false); }
                      }}>{adminAtelierSaving ? t('admin.save_saving') : t('admin.save_button')}</Button>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {adminAtelierMoments.map((m, i) => (
                      <li key={m.id || i} className="flex items-center gap-4 py-2 border-b border-zinc-800/50">
                        {m.image_url && <img src={m.image_url} alt="" className="w-12 h-12 object-cover rounded" />}
                        <span className="flex-1 text-zinc-200 truncate">{m.title}{m.subtitle ? ` – ${m.subtitle}` : ''}</span>
                        <button type="button" onClick={() => setAdminAtelierMoments(prev => prev.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-red-400 text-sm">{t('admin.remove')}</button>
                      </li>
                    ))}
                  </ul>
                </Card>
                </>
                )}
                {(adminTab === 'inventory') && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {editingPiece && (
                        <section className="space-y-6 lg:col-span-2">
                          <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-serif italic">{t('admin.edit_piece')}: {editingPiece.title}</h3>
                            <Button variant="ghost" className="text-zinc-500" onClick={() => setEditingPiece(null)}>Abbrechen</Button>
                          </div>
                          <Card className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-4">
                              <Input label="Titel" value={editPieceForm.title ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, title: e.target.value }))} />
                              <Input label="Kategorie" value={editPieceForm.category ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, category: e.target.value }))} />
                              <Input label="Seriennummer" value={editPieceForm.serial_id ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, serial_id: e.target.value }))} />
                              <Input label="Produktionszeit" value={editPieceForm.production_time ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, production_time: e.target.value }))} />
                              <Input label="Bewertung (€)" type="number" value={editPieceForm.valuation ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, valuation: e.target.value }))} />
                              <Input label="Anzahlung %" type="number" value={editPieceForm.deposit_pct ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, deposit_pct: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Preisanzeige</label>
                              <select value={editPieceForm.pricing_mode ?? 'fixed'} onChange={(e) => setEditPieceForm((f: any) => ({ ...f, pricing_mode: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                                <option value="fixed">{t('pricing.mode_fixed')}</option>
                                <option value="starting_from">{t('pricing.mode_starting_from')}</option>
                                <option value="price_on_request">{t('pricing.mode_price_on_request')}</option>
                                <option value="hidden">{t('pricing.mode_hidden')}</option>
                              </select>
                            </div>
                            <Input label="Zertifikatsdaten (JSON)" value={editPieceForm.cert_data ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, cert_data: e.target.value }))} />
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Seltenheitsgrad</label>
                              <select value={editPieceForm.rarity ?? 'Unique'} onChange={(e) => setEditPieceForm((f: any) => ({ ...f, rarity: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                                <option>Unikat</option><option>Limitiert</option><option>Selten</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Beschreibung (DE)</label>
                              <textarea value={editPieceForm.description ?? ''} onChange={(e) => setEditPieceForm((f: any) => ({ ...f, description: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50 h-28" />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                <div><label className="text-[10px] uppercase text-zinc-500 ml-1">Beschreibung (EN)</label><textarea value={editPieceForm.description_en ?? ''} onChange={(e) => setEditPieceForm((f: any) => ({ ...f, description_en: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm h-20 mt-1" /></div>
                                <div><label className="text-[10px] uppercase text-zinc-500 ml-1">Beschreibung (IT)</label><textarea value={editPieceForm.description_it ?? ''} onChange={(e) => setEditPieceForm((f: any) => ({ ...f, description_it: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm h-20 mt-1" /></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Input label="Materialien (DE)" value={editPieceForm.materials ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, materials: e.target.value }))} />
                              <Input label="Materialien (EN)" value={editPieceForm.materials_en ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, materials_en: e.target.value }))} />
                              <Input label="Materialien (IT)" value={editPieceForm.materials_it ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, materials_it: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Input label="Edelsteine (DE)" value={editPieceForm.gemstones ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, gemstones: e.target.value }))} />
                              <Input label="Edelsteine (EN)" value={editPieceForm.gemstones_en ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, gemstones_en: e.target.value }))} />
                              <Input label="Edelsteine (IT)" value={editPieceForm.gemstones_it ?? ''} onChange={(e: any) => setEditPieceForm((f: any) => ({ ...f, gemstones_it: e.target.value }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <Button className="flex-1" onClick={handleSaveEditPiece} disabled={loading}>{loading ? '…' : 'Speichern'}</Button>
                              <Button variant="secondary" onClick={() => setEditingPiece(null)}>Abbrechen</Button>
                            </div>
                          </Card>
                        </section>
                      )}
                      {!editingPiece && (
                      <section className="space-y-6">
                        <h3 className="text-2xl font-serif italic">Meisterstück erstellen</h3>
                        <Card className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Titel" value={newPiece.title} onChange={(e: any) => setNewPiece({ ...newPiece, title: e.target.value })} />
                            <Input label="Kategorie" value={newPiece.category} onChange={(e: any) => setNewPiece({ ...newPiece, category: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Seriennummer" value={newPiece.serial_id} onChange={(e: any) => setNewPiece({ ...newPiece, serial_id: e.target.value })} />
                            <Input label="Produktionszeit" value={newPiece.production_time} onChange={(e: any) => setNewPiece({ ...newPiece, production_time: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Bewertung (€)" type="number" value={newPiece.valuation} onChange={(e: any) => setNewPiece({ ...newPiece, valuation: e.target.value })} />
                            <Input label="Anzahlung %" type="number" value={newPiece.deposit_pct} onChange={(e: any) => setNewPiece({ ...newPiece, deposit_pct: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Preisanzeige</label>
                            <select value={(newPiece as any).pricing_mode ?? 'fixed'} onChange={(e) => setNewPiece({ ...newPiece, pricing_mode: e.target.value as any })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                              <option value="fixed">{t('pricing.mode_fixed')}</option>
                              <option value="starting_from">{t('pricing.mode_starting_from')}</option>
                              <option value="price_on_request">{t('pricing.mode_price_on_request')}</option>
                              <option value="hidden">{t('pricing.mode_hidden')}</option>
                            </select>
                          </div>
                          <Input label="Zertifikatsdaten (JSON)" value={newPiece.cert_data} onChange={(e: any) => setNewPiece({ ...newPiece, cert_data: e.target.value })} placeholder='{"cut": "Ideal", "clarity": "VVS1"}' />
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Seltenheitsgrad</label>
                            <select value={newPiece.rarity} onChange={(e) => setNewPiece({ ...newPiece, rarity: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                              <option>Unikat</option><option>Limitiert</option><option>Selten</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Beschreibung (DE)</label>
                            <textarea value={newPiece.description} onChange={(e) => setNewPiece({ ...newPiece, description: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50 h-32" placeholder="z. B. Eine skulpturale Komposition aus …" />
                            <p className="text-[10px] text-zinc-500 mt-1">Übersetzungen (optional) – werden je nach Sprache des Besuchers angezeigt.</p>
                            <div className="grid grid-cols-1 gap-3 mt-2">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1">Beschreibung (EN)</label>
                                <textarea value={(newPiece as any).description_en ?? ''} onChange={(e) => setNewPiece({ ...newPiece, description_en: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm focus:outline-none focus:border-amber-600/50 h-24 mt-1" placeholder="Description (English)" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1">Beschreibung (IT)</label>
                                <textarea value={(newPiece as any).description_it ?? ''} onChange={(e) => setNewPiece({ ...newPiece, description_it: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm focus:outline-none focus:border-amber-600/50 h-24 mt-1" placeholder="Descrizione (italiano)" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Materialien (DE)</label>
                            <input type="text" value={newPiece.materials} onChange={(e) => setNewPiece({ ...newPiece, materials: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50" placeholder="z. B. Weißgold oder Platin" />
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <Input label="Materialien (EN)" value={(newPiece as any).materials_en ?? ''} onChange={(e: any) => setNewPiece({ ...newPiece, materials_en: e.target.value })} placeholder="e.g. White gold or platinum" />
                              <Input label="Materialien (IT)" value={(newPiece as any).materials_it ?? ''} onChange={(e: any) => setNewPiece({ ...newPiece, materials_it: e.target.value })} placeholder="es. Oro bianco o platino" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Edelsteine (DE)</label>
                            <input type="text" value={newPiece.gemstones} onChange={(e) => setNewPiece({ ...newPiece, gemstones: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50" placeholder="z. B. Saphir / Diamant" />
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <Input label="Edelsteine (EN)" value={(newPiece as any).gemstones_en ?? ''} onChange={(e: any) => setNewPiece({ ...newPiece, gemstones_en: e.target.value })} placeholder="e.g. Sapphire / Diamond" />
                              <Input label="Edelsteine (IT)" value={(newPiece as any).gemstones_it ?? ''} onChange={(e: any) => setNewPiece({ ...newPiece, gemstones_it: e.target.value })} placeholder="es. Zaffiro / Diamante" />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Bilder des Meisterstücks</label>
                            <input ref={masterpieceFileInputRef} id="masterpiece-images-upload" type="file" className="sr-only" accept="image/*" multiple onChange={handleFileUpload} />
                            <label htmlFor="masterpiece-images-upload" className="block cursor-pointer">
                            <div
                              className={`border-2 border-dashed rounded-3xl aspect-video flex flex-col items-center justify-center p-8 text-center group transition-all cursor-pointer relative overflow-hidden ${draggingOverImages ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 hover:border-amber-600/50'}`}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingOverImages(true); }}
                              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingOverImages(false); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDraggingOverImages(false);
                                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                                if (files.length) processImageFiles(files);
                              }}
                            >
                              {(newPiece.images?.length ?? 0) > 0 ? (
                                <div className="absolute inset-0 p-4 flex flex-wrap gap-2 items-center justify-center overflow-auto">
                                  {(newPiece.images || []).map((url, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-700 shrink-0 group/img">
                                      <img src={url} alt="" className="w-full h-full object-cover" />
                                      <button type="button" onClick={(ev) => { ev.stopPropagation(); setNewPiece(prev => { const next = (prev.images || []).filter((_, i) => i !== idx); return { ...prev, images: next, image: next[0] || '' }; }); }} className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-red-400 hover:text-red-300 transition-opacity">
                                        <Plus className="w-6 h-6 rotate-45" />
                                      </button>
                                      {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-amber-600/90 text-[10px] text-center text-white font-bold">Hauptbild</span>}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <><Upload className="w-12 h-12 text-zinc-700 group-hover:text-amber-500 transition-colors mb-4" /><p className="text-sm text-zinc-500">Klicken oder Bilder hierher ziehen (mehrere möglich)</p></>
                              )}
                            </div>
                            </label>
                          </div>
                          <Button className="w-full" onClick={handleCreatePiece} disabled={loading}>Meisterstück erstellen</Button>
                        </Card>
                      </section>
                      )}

                  <div className="space-y-8">
                    <section className="space-y-6">
                      <h3 className="text-2xl font-serif italic">{t('admin.add_client')}</h3>
                      <Card className="space-y-4">
                        <Input label={t('name')} value={newClient.name} onChange={(e: any) => setNewClient({ ...newClient, name: e.target.value })} />
                        <Input label={t('email')} value={newClient.email} onChange={(e: any) => setNewClient({ ...newClient, email: e.target.value })} />
                        <Input label={t('address')} value={newClient.address} onChange={(e: any) => setNewClient({ ...newClient, address: e.target.value })} />
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={newClient.isVip} onChange={() => setNewClient({ ...newClient, isVip: !newClient.isVip })} className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-amber-600" />
                            <span className="text-xs text-zinc-400">{t('admin.vip_status')}</span>
                          </label>
                        </div>
                        <Button className="w-full" onClick={handleAddClient} disabled={loading}>{t('admin.create_client_btn')}</Button>
                      </Card>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-2xl font-serif italic">{t('admin.create_auction')}</h3>
                      <Card className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">{t('admin.select_masterpiece')}</label>
                          <select value={newAuction.masterpieceId} onChange={(e) => setNewAuction({ ...newAuction, masterpieceId: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                            <option value="">{t('admin.choose_piece')}</option>
                            {masterpieces.filter(m => m.status === 'available').map(m => (
                              <option key={m.id} value={m.id}>{m.title} ({m.serial_id})</option>
                            ))}
                          </select>
                        </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label={t('admin.start_price')} type="number" value={newAuction.startPrice} onChange={(e: any) => setNewAuction({ ...newAuction, startPrice: e.target.value })} />
                            <Input label={t('admin.end_time')} type="datetime-local" value={newAuction.endTime} onChange={(e: any) => setNewAuction({ ...newAuction, endTime: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">{t('admin.auction_terms')}</label>
                            <textarea 
                              value={(newAuction as any).terms || ''} 
                              onChange={(e) => setNewAuction({ ...newAuction, terms: e.target.value } as any)} 
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50 h-24 resize-none"
                              placeholder={t('admin.terms_placeholder')}
                            />
                          </div>
                          <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${newAuction.vipOnly ? 'bg-amber-600 border-amber-600' : 'border-zinc-700 bg-zinc-800'}`}>
                            {newAuction.vipOnly && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={newAuction.vipOnly} onChange={() => setNewAuction({ ...newAuction, vipOnly: !newAuction.vipOnly })} />
                          <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{t('admin.vip_only')}</span>
                        </label>
                        <Button className="w-full" onClick={handleCreateAuction} disabled={loading || !newAuction.masterpieceId}>{t('admin.start_auction')}</Button>
                      </Card>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-2xl font-serif italic">{t('admin.assign_piece')}</h3>
                      <Card className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">{t('admin.select_user')}</label>
                          <select value={assignPiece.userId} onChange={(e) => setAssignPiece({ ...assignPiece, userId: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                            <option value="">{t('admin.choose_user')}</option>
                            {allUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">{t('admin.select_masterpiece')}</label>
                          <select value={assignPiece.masterpieceId} onChange={(e) => setAssignPiece({ ...assignPiece, masterpieceId: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                            <option value="">{t('admin.choose_piece')}</option>
                            {masterpieces.map(m => (
                              <option key={m.id} value={m.id}>{m.title} ({m.serial_id}) - {m.status}</option>
                            ))}
                          </select>
                        </div>
                        <Button variant="secondary" className="w-full" onClick={handleAssignPiece} disabled={loading || !assignPiece.userId || !assignPiece.masterpieceId}>{t('admin.assign_ownership')}</Button>
                      </Card>
                    </section>
                  </div>
                </div>
                )}

                {/* Approval Queues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {(adminTab === 'overview') && (
                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">{t('admin.pending_purchases')}</h3>
                    <div className="space-y-4">
                      {masterpieces.filter(p => p.status === 'reserved').map(piece => {
                        const contract = adminContracts.find(c => c.masterpiece_id === piece.id && c.type === 'deposit');
                        return (
                          <Card key={piece.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {piece.image_url && <img src={piece.image_url} className="w-12 h-12 rounded-xl object-cover" />}
                              <div>
                                <p className="text-sm font-medium text-zinc-200">{piece.title}</p>
                                <p className="text-xs text-zinc-500">{piece.valuation.toLocaleString()} €</p>
                                {contract && (
                                  <div className="mt-1">
                                    <Badge variant={contract.status === 'signed' ? 'emerald' : 'amber'}>
                                      {t('admin.deposit_contract')}: {contract.status === 'signed' ? t('admin.deposit_signed') : t('admin.deposit_draft')}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleApprovePurchase(piece.id, true, user.id)} disabled={!contract || contract.status !== 'signed'}>{t('admin.approve')}</Button>
                              <Button variant="danger" className="py-1.5 px-3 text-xs" onClick={() => handleApprovePurchase(piece.id, false, user.id)}>{t('admin.reject')}</Button>
                            </div>
                          </Card>
                        );
                      })}
                      {masterpieces.filter(p => p.status === 'reserved').length === 0 && <p className="text-zinc-600 text-sm italic">{t('admin.no_pending_purchases')}</p>}
                    </div>
                  </section>
                  )}
                  {(adminTab === 'overview') && (
                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">{t('admin.active_workflows')}</h3>
                    <div className="space-y-6">
                      {masterpieces.filter(p => p.status === 'sold' || p.status === 'reserved').map(piece => (
                        <AdminWorkflowChecklist key={piece.id} piece={piece} onUpdate={handleUpdateWorkflow} />
                      ))}
                    </div>
                  </section>
                  )}
                  {(adminTab === 'resale') && (
                  <section className="space-y-4 lg:col-span-2">
                    <h3 className="text-xl font-serif italic">{t('admin.resale_requests')}</h3>
                    <div className="space-y-4">
                      {adminResaleListings.filter((rl: any) => ['signed', 'resale_pending'].includes(rl.status)).map((rl: any) => (
                        <Card key={rl.id} className="space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{rl.masterpiece_title}</p>
                              <p className="text-xs text-zinc-500">{t('admin.resale_price')}: {Number(rl.asking_price).toLocaleString()} € • {t('admin.commission')}: {rl.commission_pct}% • {rl.seller_name}</p>
                              {(rl.price_recommendation != null || rl.market_stability_score != null) && (
                                <p className="text-[11px] text-amber-500/80 mt-1">
                                  {t('admin.price_recommendation')}: {rl.price_recommendation != null ? `${Number(rl.price_recommendation).toLocaleString()} €` : '—'} • {t('admin.market_stability')}: {rl.market_stability_score != null ? rl.market_stability_score : '—'}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!rl.admin_decision && (
                                <>
                                  <Button variant="outline" className="py-1.5 px-3 text-xs" disabled={loading} onClick={() => handleResaleDecision(rl.id, 'curated_marketplace')}>{t('admin.decision_curated')}</Button>
                                  <Button variant="outline" className="py-1.5 px-3 text-xs" disabled={loading} onClick={() => handleResaleDecision(rl.id, 'private_auction')}>{t('admin.decision_auction')}</Button>
                                  <Button variant="outline" className="py-1.5 px-3 text-xs" disabled={loading} onClick={() => handleResaleDecision(rl.id, 'private_offer')}>{t('admin.decision_offer')}</Button>
                                  <Button variant="outline" className="py-1.5 px-3 text-xs" disabled={loading} onClick={() => handleResaleDecision(rl.id, 'maison_buyback')}>{t('admin.decision_buyback')}</Button>
                                  <Button variant="danger" className="py-1.5 px-3 text-xs" disabled={loading} onClick={() => handleResaleDecision(rl.id, 'reject')}>{t('admin.reject')}</Button>
                                </>
                              )}
                              {rl.admin_decision === 'curated_marketplace' && (
                                <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleApproveResale(rl.masterpiece_id, true)}>{t('admin.approve')}</Button>
                              )}
                              <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleAdjustResaleListing(rl.id)}>{t('admin.adjust_commission')}</Button>
                              <Button variant="ghost" className="py-1.5 px-3 text-xs" onClick={() => handlePrioritizeAuctionResale(rl.id)}>{t('admin.prioritize_auction')}</Button>
                              {rl.admin_decision === 'maison_buyback' && (
                                <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleSendBuybackOffer(rl.id)}>{t('admin.send_buyback_offer')}</Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                      {masterpieces.filter(p => p.status === 'resell_pending' && !adminResaleListings.some((rl: any) => rl.masterpiece_id === p.id && ['signed', 'resale_pending'].includes(rl.status))).map(piece => (
                        <Card key={piece.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {piece.image_url && <img src={piece.image_url} className="w-12 h-12 rounded-xl object-cover" />}
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{piece.title}</p>
                              <p className="text-xs text-zinc-500">{t('admin.resale_price')}: {piece.valuation.toLocaleString()} €</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleApproveResale(piece.id, true)}>{t('admin.approve')}</Button>
                            <Button variant="danger" className="py-1.5 px-3 text-xs" onClick={() => handleApproveResale(piece.id, false)}>{t('admin.reject')}</Button>
                          </div>
                        </Card>
                      ))}
                      {adminResaleListings.filter((rl: any) => ['signed', 'resale_pending'].includes(rl.status)).length === 0 && masterpieces.filter(p => p.status === 'resell_pending').length === 0 && (
                        <p className="text-zinc-600 text-sm italic">{t('admin.no_resale_requests')}</p>
                      )}
                    </div>
                  </section>
                  )}
                  {(adminTab === 'users') && (
                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">{t('admin.pending_payments')}</h3>
                    <div className="space-y-4">
                      {allUsers.map(u => (
                        <div key={u.id}>
                          {payments.filter(p => p.user_id === u.id && p.status === 'pending').map(pay => (
                            <Card key={pay.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                                <p className="text-xs text-zinc-500">{pay.reference} • {pay.amount.toLocaleString()} €</p>
                              </div>
                              <Button variant="outline" className="py-1.5 px-3 text-xs" disabled={loading} onClick={() => handleConfirmPayment(pay.id)}>{t('admin.confirm_payment')}</Button>
                            </Card>
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>
                  )}
                  {(adminTab === 'users') && (
                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">{t('admin.user_approvals')}</h3>
                    <div className="space-y-4">
                      {allUsers.filter(u => u.status === 'pending').map(u => (
                        <Card key={u.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                            <p className="text-xs text-zinc-500">{u.email} • {u.address}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="zinc" className="text-[8px] uppercase">{u.role}</Badge>
                              {u.is_vip && <Badge variant="amber" className="text-[8px] uppercase">{t('admin.wants_vip')}</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleApproveUser(u.id, true)}>{t('admin.approve')}</Button>
                            <Button variant="danger" className="py-1.5 px-3 text-xs" onClick={() => handleApproveUser(u.id, false)}>{t('admin.reject')}</Button>
                          </div>
                        </Card>
                      ))}
                      {allUsers.filter(u => u.status === 'pending').length === 0 && <p className="text-zinc-600 text-sm italic">{t('admin.no_pending_users')}</p>}
                    </div>
                  </section>
                  )}
                  {(adminTab === 'users') && (
                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">{t('admin.investor_requests')}</h3>
                    <div className="space-y-4">
                      {adminInvestorRequests.map(req => (
                        <Card key={req.id} className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-zinc-200 capitalize">{req.type} {t('admin.request_type')}</p>
                              <p className="text-xs text-zinc-500">{t('admin.investor_label')}: {req.user_name} ({req.user_email})</p>
                              {req.type === 'share' && req.masterpiece_title && (
                                <p className="text-xs text-amber-500/90 mt-1">{t('admin.piece_label')}: {req.masterpiece_title}{req.request_metadata ? (() => { try { const m = typeof req.request_metadata === 'string' ? JSON.parse(req.request_metadata) : req.request_metadata; return ` · ${m?.percentage ?? '—'}%`; } catch { return ''; } })() : ''}</p>
                              )}
                            </div>
                            <Badge variant={req.status === 'pending' ? 'amber' : req.status === 'approved' ? 'emerald' : 'red'}>{req.status}</Badge>
                          </div>
                          <p className="text-xs text-zinc-400 italic">"{req.message}"</p>
                          {req.status === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              {req.type === 'meeting' ? (
                                <Button variant="outline" className="flex-1 py-1.5 text-[10px]" onClick={() => handleApproveMeetingWithAppointment(req)}>{t('admin.approve_request')} & {t('admin.schedule_appointment')}</Button>
                              ) : (
                                <Button variant="outline" className="flex-1 py-1.5 text-[10px]" disabled={loading} onClick={() => handleInvestorRequestReview(req.id, true)}>{t('admin.approve_request')}</Button>
                              )}
                              <Button variant="danger" className="flex-1 py-1.5 text-[10px]" disabled={loading} onClick={() => handleInvestorRequestReview(req.id, false)}>{t('admin.reject_request')}</Button>
                            </div>
                          )}
                        </Card>
                      ))}
                      {adminInvestorRequests.length === 0 && <p className="text-zinc-600 text-sm italic">{t('admin.no_investor_requests')}</p>}
                    </div>
                  </section>
                  )}
                  {(adminTab === 'inventory') && (
                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">{t('admin.fractional_offers')}</h3>
                    <Card className="space-y-4 p-4">
                      <div className="flex flex-wrap gap-4 items-end">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">{t('admin.choose_piece')}</label>
                          <select value={fractionalOfferForm.masterpieceId} onChange={e => setFractionalOfferForm(f => ({ ...f, masterpieceId: e.target.value ? Number(e.target.value) : '' }))} className="bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3 text-zinc-200 text-sm min-w-[200px]">
                            <option value="">—</option>
                            {masterpieces.filter(p => ['sold', 'fractional_open', 'fractional_full', 'fractional_resale'].includes(p.status)).map(p => (
                              <option key={p.id} value={p.id}>{p.title} ({p.serial_id})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">{t('admin.available_pct')}</label>
                          <input type="number" min={0} step={1} value={fractionalOfferForm.available_pct} onChange={e => setFractionalOfferForm(f => ({ ...f, available_pct: Number(e.target.value) || 0 }))} className="bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3 text-zinc-200 text-sm w-24" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">{t('admin.price_per_pct')}</label>
                          <input type="number" min={0} step={100} value={fractionalOfferForm.price_per_pct === '' ? '' : fractionalOfferForm.price_per_pct} onChange={e => setFractionalOfferForm(f => ({ ...f, price_per_pct: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="optional" className="bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3 text-zinc-200 text-sm w-28" />
                        </div>
                        <Button variant="primary" className="py-2 px-4 text-sm" disabled={loading} onClick={async () => {
                          if (!fractionalOfferForm.masterpieceId) return;
                          setLoading(true);
                          try {
                            const res = await fetch('/api/admin/fractional/offer', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                masterpiece_id: fractionalOfferForm.masterpieceId,
                                available_pct: fractionalOfferForm.available_pct,
                                price_per_pct: fractionalOfferForm.price_per_pct === '' ? null : fractionalOfferForm.price_per_pct
                              }),
                              credentials: 'include'
                            });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok) {
                              const list = await fetch('/api/admin/fractional-offers', { credentials: 'include' }).then(r => r.ok ? r.json() : []);
                              setAdminFractionalOffers(list);
                              notifyUser("Anteils-Angebot gespeichert.", "success");
                            } else {
                              notifyUser(data.error || t('errors.generic'), 'error');
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}>{t('admin.set_fractional_offer')}</Button>
                      </div>
                      <div className="border-t border-zinc-800 pt-3">
                        <p className="text-xs text-zinc-500 mb-2">Aktuelle Angebote</p>
                        {adminFractionalOffers.length === 0 ? <p className="text-zinc-600 text-sm italic">Keine.</p> : (
                          <ul className="space-y-1 text-sm">
                            {adminFractionalOffers.map((row: any) => (
                              <li key={row.masterpiece_id} className="flex justify-between items-center text-zinc-300">
                                <span>{row.title} ({row.serial_id})</span>
                                <span className="text-amber-500/90">{row.available_pct}% verfügbar{row.price_per_pct != null ? ` · ${Number(row.price_per_pct).toLocaleString('de-DE')} €/%` : ''}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Card>
                  </section>
                  )}

                  {(adminTab === 'appointments') && (
                  <section className="space-y-4 lg:col-span-2">
                    <h3 className="text-xl font-serif italic">{t('admin.appointments')}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{t('admin.schedule_appointment')}</p>
                        <Card className="space-y-3 p-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">{t('admin.customer')}</label>
                            <select value={newAppointmentForm.userId} onChange={e => setNewAppointmentForm(f => ({ ...f, userId: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-200 text-sm">
                              <option value="">— {t('admin.customer')} —</option>
                              {allUsers.filter(u => u.role !== 'admin' && u.role !== 'super_admin').map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1">{t('admin.appointment_date')}</label>
                              <input type="date" value={newAppointmentForm.date} onChange={e => setNewAppointmentForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1">{t('admin.appointment_time')}</label>
                              <input type="time" value={newAppointmentForm.time} onChange={e => setNewAppointmentForm(f => ({ ...f, time: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">{t('admin.appointment_title')}</label>
                            <input type="text" value={newAppointmentForm.title} onChange={e => setNewAppointmentForm(f => ({ ...f, title: e.target.value }))} placeholder={t('investor.schedule_meeting')} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">{t('admin.appointment_notes')}</label>
                            <textarea value={newAppointmentForm.notes} onChange={e => setNewAppointmentForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-sm resize-none" />
                          </div>
                          <Button variant="outline" className="w-full py-2 text-sm" onClick={handleCreateAppointmentFromForm}>{t('admin.schedule_appointment')}</Button>
                        </Card>
                      </div>
                      <div className="space-y-3">
                        {adminAppointments.map(a => (
                          <Card key={a.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{(a as any).user_name} · {(a as any).admin_name}</p>
                              <p className="text-xs text-zinc-500">{new Date(a.scheduled_at).toLocaleString()} {a.title && `· ${a.title}`}</p>
                            </div>
                            <Badge variant={a.status === 'confirmed' ? 'emerald' : a.status === 'cancelled' ? 'red' : 'amber'}>{a.status}</Badge>
                          </Card>
                        ))}
                        {adminAppointments.length === 0 && <p className="text-zinc-600 text-sm italic">{t('admin.no_appointments')}</p>}
                      </div>
                    </div>
                  </section>
                  )}

                  {(adminTab === 'advisors') && (
                  <section className="space-y-6">
                    <h3 className="text-xl font-serif italic">{t('admin.advisors') || 'Strategic Private Advisors'}</h3>
                    <Card className="p-6 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Advisor einladen</h4>
                      <div className="flex flex-wrap gap-3 items-center">
                        <input type="text" placeholder="E-Mail" id="admin-invite-email" className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-4 text-zinc-200 text-sm w-56" />
                        <input type="text" placeholder="Name" id="admin-invite-name" className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-4 text-zinc-200 text-sm w-56" />
                        <div className="flex items-center gap-2">
                          <input type="text" placeholder={t('admin.password_for_advisor') || 'Passwort (selbst wählen oder erzeugen)'} id="admin-invite-password" className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-4 text-zinc-200 text-sm w-52" title={t('admin.password_for_advisor_hint') || 'Leer lassen: System erzeugt eines. Sonst hier eingeben oder per Button erzeugen – dann mündlich weitergeben.'} />
                          <Button type="button" variant="outline" size="sm" className="text-xs whitespace-nowrap" onClick={() => {
                            const pwd = 'Temp' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase();
                            const el = document.getElementById('admin-invite-password') as HTMLInputElement;
                            if (el) { el.value = pwd; el.select(); notifyUser(t('admin.password_generated') || 'Passwort erzeugt. Sie können es mündlich weitergeben.'); }
                          }}>{t('admin.generate_password') || 'Passwort erzeugen'}</Button>
                        </div>
                        <Button variant="primary" className="text-sm" onClick={async () => {
                          const email = (document.getElementById('admin-invite-email') as HTMLInputElement)?.value?.trim();
                          const name = (document.getElementById('admin-invite-name') as HTMLInputElement)?.value?.trim();
                          const password = (document.getElementById('admin-invite-password') as HTMLInputElement)?.value?.trim();
                          if (!email || !name) { notifyUser('E-Mail und Name erforderlich.', 'error'); return; }
                          const res = await fetch('/api/admin/advisors/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name, password: password || undefined }), credentials: 'include' });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok) {
                            setLastInvitedAdvisorPassword({ email, password: data.password || '' });
                            (document.getElementById('admin-invite-email') as HTMLInputElement).value = '';
                            (document.getElementById('admin-invite-name') as HTMLInputElement).value = '';
                            (document.getElementById('admin-invite-password') as HTMLInputElement).value = '';
                            fetchData();
                            notifyUser(data.message || 'Advisor eingeladen. Passwort unten kopieren und weitergeben.');
                          } else notifyUser(data.error || 'Fehler', 'error');
                        }}>{t('admin.invite_advisor') || 'Einladen'}</Button>
                      </div>
                      {lastInvitedAdvisorPassword && (
                        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center gap-3">
                          <span className="text-sm text-zinc-300">Passwort für <strong>{lastInvitedAdvisorPassword.email}</strong> (sicher weitergeben):</span>
                          <code className="px-3 py-1.5 bg-zinc-900 rounded text-amber-200 font-mono text-sm">{lastInvitedAdvisorPassword.password}</code>
                          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(lastInvitedAdvisorPassword.password); notifyUser('Passwort kopiert.', 'success'); }}>Kopieren</Button>
                          <Button variant="ghost" size="sm" className="text-zinc-500" onClick={() => setLastInvitedAdvisorPassword(null)}>Schließen</Button>
                        </div>
                      )}
                    </Card>
                    <div className="space-y-3">
                      {adminAdvisors.map((a: any) => (
                        <Card key={a.profile_id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-zinc-200">{a.name}</p>
                            <p className="text-xs text-zinc-500">{a.email}</p>
                            <p className="text-[10px] text-zinc-600 mt-1">Status: {a.profile_status}</p>
                          </div>
                          <div className="flex gap-3 flex-wrap items-center">
                            {a.profile_status === 'nda_signed' && (
                              <Button variant="outline" size="sm" onClick={async () => {
                                const res = await fetch(`/api/admin/advisors/${a.profile_id}/activate`, { method: 'PUT', credentials: 'include' });
                                if (res.ok) fetchData();
                              }}>{t('admin.activate_advisor') || 'Aktivieren'}</Button>
                            )}
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-zinc-500 whitespace-nowrap">{t('admin.commission_override') || 'Provisionssatz'}</label>
                              <input type="number" min="0" max="100" step="0.5" defaultValue={a.default_commission_pct} className="w-16 bg-zinc-900/50 border border-zinc-800 rounded py-1.5 px-2 text-zinc-200 text-sm" onBlur={async (e) => {
                                const pct = Number(e.target.value);
                                if (Number.isNaN(pct)) return;
                                await fetch(`/api/admin/advisors/${a.profile_id}/commission`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commissionPct: pct }), credentials: 'include' });
                                fetchData();
                              }} />
                              <span className="text-xs text-zinc-500">%</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {adminAdvisors.length === 0 && <p className="text-zinc-500 text-sm italic">{t('admin.no_advisors') || 'Keine Advisors.'}</p>}
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{t('admin.advisor_commissions')}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-zinc-500 border-b border-zinc-800">
                              <th className="py-2 pr-2">{t('advisor.advisor_name') || 'Berater'}</th>
                              <th className="py-2 pr-2">{t('advisor.client_name')}</th>
                              <th className="py-2 pr-2">{t('advisor.piece')}</th>
                              <th className="py-2 pr-2">{t('advisor.sale_amount')}</th>
                              <th className="py-2 pr-2">{t('advisor.commission_amount')}</th>
                              <th className="py-2 pr-2">{t('advisor.status')}</th>
                              <th className="py-2 pr-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminAdvisorCommissions.map((c: any) => (
                              <tr key={c.id} className="border-b border-zinc-800/50">
                                <td className="py-2 pr-2 text-zinc-300">{c.advisor_name}</td>
                                <td className="py-2 pr-2 text-zinc-400">{c.client_name || '—'}</td>
                                <td className="py-2 pr-2 text-zinc-400">{c.piece_title || c.serial_id || '—'}</td>
                                <td className="py-2 pr-2">{(c.sale_amount ?? 0).toLocaleString('de-DE')} €</td>
                                <td className="py-2 pr-2 text-amber-500">{(c.commission_amount ?? 0).toLocaleString('de-DE')} €</td>
                                <td className="py-2 pr-2"><Badge variant={c.status === 'paid_out' ? 'emerald' : 'amber'}>{c.status}</Badge></td>
                                <td className="py-2">
                                  {c.status !== 'paid_out' && (
                                    <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                                      const res = await fetch(`/api/admin/advisors/commissions/${c.id}/pay`, { method: 'POST', credentials: 'include' });
                                      if (res.ok) { notifyUser(t('admin.commission_marked_paid')); fetchData(); }
                                    }}>{t('admin.mark_paid') || 'Ausgezahlt'}</Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {adminAdvisorCommissions.length === 0 && <p className="text-zinc-500 text-sm italic">{t('admin.no_commissions')}</p>}
                    </div>
                    <Card className="p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{t('admin.export_commissions')}</h4>
                        <Button variant="outline" size="sm" onClick={() => window.open('/api/admin/advisors/commissions/export', '_blank')}><FileDown className="w-4 h-4" /> CSV</Button>
                      </div>
                    </Card>
                  </section>
                  )}

                  {(adminTab === 'intelligence') && (
                  <section className="space-y-8">
                    <h3 className="text-xl font-serif italic text-amber-500/90">Imperial Intelligence</h3>
                    <Card className="p-6 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">AI Client Profiling</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-zinc-500 border-b border-zinc-800">
                              <th className="py-2 pr-2">Name</th><th className="py-2 pr-2">UHNW Score</th><th className="py-2 pr-2">Upsell</th><th className="py-2 pr-2">Invite</th><th className="py-2 pr-2">Spend</th><th className="py-2 pr-2">Vault Eng.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {intelligenceClientProfiles.slice(0, 50).map((p: any) => (
                              <tr key={p.user_id} className="border-b border-zinc-800/50">
                                <td className="py-2 pr-2 text-zinc-300">{p.name}</td>
                                <td className="py-2 pr-2"><span className="text-amber-500 font-medium">{p.uhnw_potential_score ?? p.uhnw_score ?? 0}</span></td>
                                <td className="py-2 pr-2">{p.upsell_recommendation ? <Badge variant="amber">Yes</Badge> : '—'}</td>
                                <td className="py-2 pr-2">{p.invite_recommendation ? <Badge variant="emerald">Yes</Badge> : '—'}</td>
                                <td className="py-2 pr-2">{(p.total_spend ?? 0).toLocaleString('de-DE')} €</td>
                                <td className="py-2 pr-2">{Math.round(p.vault_engagement_level ?? 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                    <Card className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Advisor Performance</h4>
                        <Button variant="outline" size="sm" onClick={() => window.open('/api/admin/intelligence/advisor-analytics/export', '_blank')}><FileDown className="w-4 h-4" /> CSV</Button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-zinc-500 border-b border-zinc-800">
                              <th className="py-2 pr-2">Advisor</th><th className="py-2 pr-2">Revenue</th><th className="py-2 pr-2">Commission Paid</th><th className="py-2 pr-2">Pending</th><th className="py-2 pr-2">Conversion %</th><th className="py-2 pr-2">Avg Deal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {intelligenceAdvisorAnalytics.map((a: any) => (
                              <tr key={a.profile_id} className="border-b border-zinc-800/50">
                                <td className="py-2 pr-2 text-zinc-300">{a.advisor_name}</td>
                                <td className="py-2 pr-2">{(a.total_revenue ?? 0).toLocaleString('de-DE')} €</td>
                                <td className="py-2 pr-2 text-emerald-500/90">{(a.commission_paid ?? 0).toLocaleString('de-DE')} €</td>
                                <td className="py-2 pr-2 text-amber-500/90">{(a.commission_pending ?? 0).toLocaleString('de-DE')} €</td>
                                <td className="py-2 pr-2">{a.conversion_rate ?? a.conversion_rate_pct ?? 0}%</td>
                                <td className="py-2 pr-2">{(a.average_deal_size ?? a.avg_deal_size ?? 0).toLocaleString('de-DE')} €</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                    <Card className="p-6 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Scarcity Heatmap</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-zinc-500 border-b border-zinc-800">
                              <th className="py-2 pr-2">Piece</th><th className="py-2 pr-2">Views</th><th className="py-2 pr-2">Wishlist</th><th className="py-2 pr-2">Duration</th><th className="py-2 pr-2">Demand</th><th className="py-2 pr-2">Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {intelligenceScarcityHeatmap.slice(0, 30).map((h: any) => (
                              <tr key={h.masterpiece_id} className={`border-b border-zinc-800/50 ${(h.scarcity_intensity ?? h.demand_score) >= 70 ? 'bg-amber-500/5' : (h.scarcity_intensity ?? h.demand_score) >= 30 ? 'bg-zinc-800/20' : ''}`}>
                                <td className="py-2 pr-2 text-zinc-300">{h.title}</td>
                                <td className="py-2 pr-2">{h.views ?? 0}</td>
                                <td className="py-2 pr-2">{h.wishlist_adds ?? h.wishlist ?? 0}</td>
                                <td className="py-2 pr-2">{h.viewing_duration_sec ?? h.viewing_duration_seconds ?? 0}s</td>
                                <td className="py-2 pr-2 text-amber-500/90">{h.scarcity_intensity_score ?? h.demand_score ?? 0}</td>
                                <td className="py-2 pr-2"><Badge variant={(h.demand_level ?? h.scarcity_intensity) === 'high_demand' ? 'amber' : (h.demand_level ?? h.scarcity_intensity) === 'low_interest' ? 'default' : 'outline'}>{h.demand_level ?? h.scarcity_intensity ?? '—'}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Prestige Evolution</h4>
                      <p className="text-xs text-zinc-500 mb-2">Recalculate client tiers from spend, resale and investment activity.</p>
                      <Button variant="outline" size="sm" onClick={async () => {
                        const res = await fetch('/api/admin/intelligence/recalc-prestige', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
                        if (res.ok) { const d = await res.json(); notifyUser(d.recalculated ? `Tiers updated for ${d.recalculated} users.` : 'Tier updated.', 'success'); fetchData(); }
                      }}>Recalc all tiers</Button>
                    </Card>
                  </section>
                  )}

                  {(adminTab === 'legacy') && (
                  <section className="space-y-6">
                    <h3 className="text-xl font-serif italic text-amber-500/90">{t('admin.tab_legacy')}</h3>
                    <Card className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-zinc-500 border-b border-zinc-800">
                              <th className="py-2 pr-2">User</th><th className="py-2 pr-2">Beneficiary</th><th className="py-2 pr-2">Contact</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Created</th><th className="py-2 pr-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminLegacyRequests.map((r: any) => (
                              <tr key={r.id} className="border-b border-zinc-800/50">
                                <td className="py-2 pr-2 text-zinc-300">{r.user_name}</td>
                                <td className="py-2 pr-2">{r.beneficiary_name}</td>
                                <td className="py-2 pr-2 text-zinc-400">{r.beneficiary_contact || '—'}</td>
                                <td className="py-2 pr-2"><Badge variant={r.status === 'approved' ? 'emerald' : r.status === 'rejected' ? 'red' : 'amber'}>{r.status}</Badge></td>
                                <td className="py-2 pr-2 text-zinc-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                                <td className="py-2 pr-2">
                                  {r.status === 'pending' && (
                                    <div className="flex gap-1">
                                      <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                                        const res = await fetch(`/api/admin/legacy/requests/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }), credentials: 'include' });
                                        if (res.ok) { notifyUser('Approved.', 'success'); fetch('/api/admin/legacy/requests', { credentials: 'include' }).then(x => x.ok && x.json().then(setAdminLegacyRequests)); }
                                      }}>Approve</Button>
                                      <Button variant="danger" size="sm" className="text-xs" onClick={async () => {
                                        const res = await fetch(`/api/admin/legacy/requests/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' }), credentials: 'include' });
                                        if (res.ok) { notifyUser('Rejected.', 'success'); fetch('/api/admin/legacy/requests', { credentials: 'include' }).then(x => x.ok && x.json().then(setAdminLegacyRequests)); }
                                      }}>Reject</Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {adminLegacyRequests.length === 0 && <p className="text-zinc-500 text-sm italic py-4">No legacy requests.</p>}
                    </Card>
                  </section>
                  )}

                  {(adminTab === 'intelligence') && (
                  <section className="space-y-8">
                    <h3 className="text-xl font-serif italic text-amber-500/90">Imperial Intelligence</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Button variant="outline" className="text-sm" onClick={async () => { const r = await fetch('/api/admin/intelligence/client-profiles', { credentials: 'include' }); if (r.ok) setIntelligenceClientProfiles(await r.json()); }}>Client Profiles laden</Button>
                      <Button variant="outline" className="text-sm" onClick={async () => { const r = await fetch('/api/admin/intelligence/advisor-analytics', { credentials: 'include' }); if (r.ok) setIntelligenceAdvisorAnalytics(await r.json()); }}>Advisor Analytics laden</Button>
                      <Button variant="outline" className="text-sm" onClick={async () => { const r = await fetch('/api/admin/intelligence/scarcity-heatmap', { credentials: 'include' }); if (r.ok) setIntelligenceScarcityHeatmap(await r.json()); }}>Scarcity Heatmap laden</Button>
                    </div>
                    {intelligenceClientProfiles.length > 0 && (
                      <Card className="p-4 overflow-x-auto">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">AI Client Profiling</h4>
                        <table className="w-full text-sm">
                          <thead><tr className="text-left text-zinc-500 border-b border-zinc-800"><th className="py-2 pr-2">Name</th><th className="py-2 pr-2">UHNW Score</th><th className="py-2 pr-2">Upsell</th><th className="py-2 pr-2">Invite</th><th className="py-2 pr-2">Spend</th></tr></thead>
                          <tbody>
                            {intelligenceClientProfiles.slice(0, 50).map((p: any) => (
                              <tr key={p.user_id} className="border-b border-zinc-800/50"><td className="py-2 pr-2 text-zinc-300">{p.name}</td><td className="py-2 pr-2 text-amber-500">{p.uhnw_potential_score ?? '—'}</td><td className="py-2 pr-2">{p.upsell_recommendation ? <Badge variant="emerald">Yes</Badge> : '—'}</td><td className="py-2 pr-2">{p.invite_recommendation ? <Badge variant="amber">Yes</Badge> : '—'}</td><td className="py-2 pr-2">{(p.total_spend ?? 0).toLocaleString('de-DE')} €</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    )}
                    {intelligenceAdvisorAnalytics.length > 0 && (
                      <Card className="p-4 overflow-x-auto">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Advisor Performance</h4>
                          <Button variant="outline" size="sm" onClick={() => window.open('/api/admin/intelligence/advisor-analytics/export', '_blank')}><FileDown className="w-4 h-4" /> CSV</Button>
                        </div>
                        <table className="w-full text-sm">
                          <thead><tr className="text-left text-zinc-500 border-b border-zinc-800"><th className="py-2 pr-2">Advisor</th><th className="py-2 pr-2">Revenue</th><th className="py-2 pr-2">Commission Paid</th><th className="py-2 pr-2">Pending</th><th className="py-2 pr-2">Conversion %</th><th className="py-2 pr-2">Avg Deal</th></tr></thead>
                          <tbody>
                            {intelligenceAdvisorAnalytics.map((a: any) => (
                              <tr key={a.profile_id} className="border-b border-zinc-800/50"><td className="py-2 pr-2 text-zinc-300">{a.advisor_name}</td><td className="py-2 pr-2">{(a.total_revenue ?? 0).toLocaleString('de-DE')} €</td><td className="py-2 pr-2 text-amber-500">{(a.commission_paid ?? 0).toLocaleString('de-DE')} €</td><td className="py-2 pr-2">{(a.commission_pending ?? 0).toLocaleString('de-DE')} €</td><td className="py-2 pr-2">{a.conversion_rate ?? a.conversion_rate_pct ?? '—'}%</td><td className="py-2 pr-2">{(a.average_deal_size ?? a.avg_deal_size ?? 0).toLocaleString('de-DE')} €</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    )}
                    {intelligenceScarcityHeatmap.length > 0 && (
                      <Card className="p-4 overflow-x-auto">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">Scarcity Heatmap</h4>
                        <table className="w-full text-sm">
                          <thead><tr className="text-left text-zinc-500 border-b border-zinc-800"><th className="py-2 pr-2">Piece</th><th className="py-2 pr-2">Views</th><th className="py-2 pr-2">Wishlist</th><th className="py-2 pr-2">Duration</th><th className="py-2 pr-2">Demand</th><th className="py-2 pr-2">Level</th></tr></thead>
                          <tbody>
                            {intelligenceScarcityHeatmap.slice(0, 40).map((h: any) => (
                              <tr key={h.masterpiece_id} className={`border-b border-zinc-800/50 ${(h.scarcity_intensity ?? h.demand_score) >= 70 ? 'bg-amber-500/5' : (h.scarcity_intensity ?? h.demand_score) >= 30 ? 'bg-zinc-800/30' : ''}`}><td className="py-2 pr-2 text-zinc-300 truncate max-w-[180px]">{h.title}</td><td className="py-2 pr-2">{h.views ?? 0}</td><td className="py-2 pr-2">{h.wishlist_adds ?? h.wishlist ?? 0}</td><td className="py-2 pr-2">{h.viewing_duration_sec ?? h.viewing_duration_seconds ?? 0}s</td><td className="py-2 pr-2 text-amber-500/90">{h.scarcity_intensity_score ?? h.demand_score ?? '—'}</td><td className="py-2 pr-2"><Badge variant={(h.demand_level ?? h.scarcity_intensity) === 'high_demand' ? 'amber' : (h.demand_level ?? h.scarcity_intensity) === 'low_interest' ? 'default' : 'outline'}>{h.demand_level ?? h.scarcity_intensity ?? '—'}</Badge></td></tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    )}
                    <Card className="p-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Prestige Evolution</h4>
                      <p className="text-xs text-zinc-500 mb-3">Tier aller Kunden anhand Aktivität neu berechnen.</p>
                      <Button variant="outline" size="sm" onClick={async () => { const r = await fetch('/api/admin/intelligence/recalc-prestige', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}), credentials: 'include' }); if (r.ok) { const d = await r.json(); notifyUser(d.recalculated ? `Tier für ${d.recalculated} Nutzer aktualisiert.` : 'Tier aktualisiert.', 'success'); fetchData(); } }}>Tier neu berechnen</Button>
                    </Card>
                  </section>
                  )}

                  {(adminTab === 'legacy') && (
                  <section className="space-y-6">
                    <h3 className="text-xl font-serif italic text-amber-500/90">Legacy / Begünstigte</h3>
                    <Button variant="outline" size="sm" onClick={async () => { const r = await fetch('/api/admin/legacy/requests', { credentials: 'include' }); if (r.ok) setAdminLegacyRequests(await r.json()); }}>Anfragen laden</Button>
                    {adminLegacyRequests.length > 0 ? (
                      <Card className="p-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="text-left text-zinc-500 border-b border-zinc-800"><th className="py-2 pr-2">Nutzer</th><th className="py-2 pr-2">Begünstigter</th><th className="py-2 pr-2">Kontakt</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2"></th></tr></thead>
                          <tbody>
                            {adminLegacyRequests.map((lr: any) => (
                              <tr key={lr.id} className="border-b border-zinc-800/50">
                                <td className="py-2 pr-2 text-zinc-300">{lr.user_name} ({lr.user_email})</td>
                                <td className="py-2 pr-2">{lr.beneficiary_name}</td>
                                <td className="py-2 pr-2 text-zinc-400">{lr.beneficiary_contact || '—'}</td>
                                <td className="py-2 pr-2"><Badge variant={lr.status === 'approved' ? 'emerald' : lr.status === 'rejected' ? 'red' : 'amber'}>{lr.status}</Badge></td>
                                <td className="py-2 pr-2">{lr.status === 'pending' && (<><Button variant="outline" size="sm" className="mr-1" onClick={async () => { await fetch(`/api/admin/legacy/requests/${lr.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }), credentials: 'include' }); fetchData(); setAdminLegacyRequests(prev => prev.map((x: any) => x.id === lr.id ? { ...x, status: 'approved' } : x)); }}>Freigeben</Button><Button variant="danger" size="sm" onClick={async () => { await fetch(`/api/admin/legacy/requests/${lr.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' }), credentials: 'include' }); setAdminLegacyRequests(prev => prev.map((x: any) => x.id === lr.id ? { ...x, status: 'rejected' } : x)); }}>Ablehnen</Button></>)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    ) : <p className="text-zinc-500 text-sm italic">Keine Legacy-Anfragen. Nutzer können unter Vault oder Profil einen Begünstigten anlegen.</p>}
                  </section>
                  )}

                  {(adminTab === 'settings') && (
                  <>
                  <section className="space-y-4 lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="text-xl font-serif italic">{t('admin.signed_contracts')}</h3>
                      <Button variant="outline" className="text-xs" disabled={loading} onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await fetch('/api/admin/contracts/regenerate', { method: 'POST', credentials: 'include' });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok && data.success) {
                            notifyUser(`Verträge neu erstellt: ${data.updated}/${data.total} aktualisiert.${data.skipped?.length ? ` ${data.skipped.length} übersprungen.` : ''}`, 'success');
                            fetchData();
                          } else {
                            notifyUser(data.error || 'Regenerierung fehlgeschlagen.', 'error');
                          }
                        } finally {
                          setLoading(false);
                        }
                      }}>Alle Verträge mit aktuellen Daten neu erstellen</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adminContracts.filter(c => c.status === 'signed').map(c => (
                        <Card key={c.id} className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-zinc-200 capitalize">{c.type === 'deposit' ? t('admin.deposit_contract_type') : c.type === 'purchase' ? t('admin.purchase_contract_type') : c.type}</p>
                              <p className="text-xs text-zinc-500">{t('admin.customer')}: {c.user_name}</p>
                              {c.piece_title && <p className="text-xs text-zinc-500">{t('admin.piece_label')}: {c.piece_title}</p>}
                            </div>
                            <Badge variant="emerald">{t('common.signed')}</Badge>
                          </div>
                          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 max-h-40 overflow-y-auto">
                            <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap">{c.content}</pre>
                          </div>
                          <p className="text-[10px] text-zinc-600 italic">{t('admin.signed_at')} {new Date(c.signed_at).toLocaleString()}</p>
                        </Card>
                      ))}
                      {adminContracts.filter(c => c.status === 'signed').length === 0 && <p className="text-zinc-600 text-sm italic col-span-full">{t('admin.no_signed_contracts')}</p>}
                    </div>
                  </section>

                  <section className="space-y-4 lg:col-span-2">
                    <h3 className="text-xl font-serif italic">Finanzen, Export & DSGVO</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-4 space-y-3">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Umsatz-Dashboard</h4>
                        {adminRevenue && (
                          <>
                            <p className="text-2xl font-bold text-amber-500">{(adminRevenue.total_ledger ?? 0).toLocaleString('de-DE')} €</p>
                            <p className="text-xs text-zinc-500">Anzahlungen: {(adminRevenue.deposits_received ?? 0).toLocaleString('de-DE')} € · Rest: {(adminRevenue.full_payments_received ?? 0).toLocaleString('de-DE')} €</p>
                            <p className="text-xs text-zinc-500">Resale-Gebühren: {(adminRevenue.total_resale_fee ?? 0).toLocaleString('de-DE')} €</p>
                          </>
                        )}
                        {!adminRevenue && <p className="text-zinc-600 text-sm">—</p>}
                      </Card>
                      <Card className="p-4 space-y-3">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Export</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" className="text-xs" onClick={async () => { const r = await fetch('/api/admin/inventory/export'); const blob = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'antonio-bellanova-inventory.csv'; a.click(); }}>{t('admin.export_inventory_csv')}</Button>
                          <Button variant="outline" className="text-xs" onClick={async () => { const r = await fetch('/api/admin/auctions/export'); const blob = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'auctions-export.csv'; a.click(); }}>Auktionen CSV</Button>
                          <Button variant="outline" className="text-xs" onClick={async () => { try { const r = await fetch('/api/admin/backup'); if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Backup fehlgeschlagen'); } const blob = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `antonio-bellanova-vault-${new Date().toISOString().slice(0, 10)}.db`; a.click(); URL.revokeObjectURL(a.href); notifyUser('Datenbank-Backup heruntergeladen.', 'success'); } catch (err) { notifyUser(err instanceof Error ? err.message : 'Backup fehlgeschlagen.', 'error'); } }}>Datenbank sichern</Button>
                        </div>
                      </Card>
                      <Card className="p-4 space-y-3">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Bank-Konfiguration</h4>
                        <input type="text" placeholder="IBAN" value={adminBankConfig.iban ?? ''} onChange={e => setAdminBankConfig((c: any) => ({ ...c, iban: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200" />
                        <input type="text" placeholder="BIC" value={adminBankConfig.bic ?? ''} onChange={e => setAdminBankConfig((c: any) => ({ ...c, bic: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200" />
                        <Button variant="outline" className="text-xs" onClick={async () => { await fetch('/api/admin/bank-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminBankConfig) }); notifyUser('Bank-Konfiguration gespeichert.', 'success'); }}>Speichern</Button>
                      </Card>
                      <Card className="p-4 space-y-3">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Resale-Erlöse</h4>
                        {adminResaleRevenue && <p className="text-xl font-bold text-zinc-200">{(adminResaleRevenue.total_resale_revenue ?? 0).toLocaleString('de-DE')} €</p>}
                        {adminResaleRevenue?.entries?.length > 0 && <p className="text-xs text-zinc-500">{adminResaleRevenue.entries.length} Einträge</p>}
                        {(!adminResaleRevenue || !adminResaleRevenue.entries?.length) && <p className="text-zinc-600 text-sm">Keine Einträge.</p>}
                      </Card>
                    </div>
                    <Card className="p-4 mt-4">
                      <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">DSGVO Datenanfragen</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {adminGdprRequests.map((req: any) => (
                          <div key={req.id} className="flex items-center justify-between gap-2 py-2 border-b border-zinc-800">
                            <span className="text-sm text-zinc-300">{req.name ?? req.email} · {req.status ?? 'offen'}</span>
                            {req.status !== 'completed' && <Button variant="ghost" className="text-xs py-1" onClick={async () => { await fetch(`/api/admin/gdpr/data-request/${req.id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) }); fetchData(); }}>Erledigt</Button>}
                          </div>
                        ))}
                        {(!adminGdprRequests || adminGdprRequests.length === 0) && <p className="text-zinc-600 text-sm">Keine offenen Anfragen.</p>}
                      </div>
                    </Card>
                    <Card className="p-4 mt-4">
                      <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Service-Anfragen</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {adminServiceRequests.map((req: any) => (
                          <div key={req.id} className="flex items-center justify-between gap-2 py-2 border-b border-zinc-800">
                            <div className="min-w-0">
                              <span className="text-sm text-zinc-300 block truncate">{req.user_name ?? req.user_email} · {req.type ?? '—'}</span>
                              <span className="text-xs text-zinc-500 truncate block">{req.masterpiece_title ? `${req.masterpiece_title} (${req.serial_id ?? ''})` : '—'} {req.description ? `· ${req.description}` : ''}</span>
                            </div>
                            {req.status !== 'completed' && <Button variant="ghost" className="text-xs py-1 shrink-0" onClick={async () => { await fetch(`/api/admin/service-requests/${req.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) }); const r = await fetch('/api/admin/service-requests'); if (r.ok) setAdminServiceRequests(await r.json()); }}>Erledigt</Button>}
                            {req.status === 'completed' && <span className="text-xs text-emerald-500 shrink-0">Erledigt</span>}
                          </div>
                        ))}
                        {(!adminServiceRequests || adminServiceRequests.length === 0) && <p className="text-zinc-600 text-sm">Keine Service-Anfragen.</p>}
                      </div>
                    </Card>
                    <Card className="p-4 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Kontaktanfragen</h4>
                        <Button variant="outline" className="text-xs" onClick={async () => {
                          const r = await fetch('/api/admin/contact-requests/export', { credentials: 'include' });
                          const blob = await r.blob();
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'antonio-bellanova-contact-requests.csv'; a.click(); URL.revokeObjectURL(a.href);
                        }}>
                          <FileDown className="w-3 h-3" /> CSV
                        </Button>
                      </div>
                      <div className="space-y-3 max-h-56 overflow-y-auto">
                        {adminContactRequests.map((req: any) => (
                          <div key={req.id} className="py-2 border-b border-zinc-800 last:border-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-sm font-medium text-zinc-200">{req.name}</span>
                              <span className="text-xs text-zinc-500 shrink-0">{new Date(req.created_at).toLocaleString('de-DE')}</span>
                            </div>
                            <p className="text-xs text-zinc-500">{req.email}{req.subject ? ` · ${req.subject}` : ''}</p>
                            <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{req.message}</p>
                          </div>
                        ))}
                        {(!adminContactRequests || adminContactRequests.length === 0) && <p className="text-zinc-600 text-sm">Keine Kontaktanfragen.</p>}
                      </div>
                    </Card>
                  </section>

                  <section className="space-y-4 lg:col-span-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-serif italic">Audit-Log</h3>
                      <Button variant="outline" className="text-xs" onClick={async () => {
                        const logs = adminAuditLogs.length ? adminAuditLogs : await (await fetch('/api/admin/audit-logs?limit=500')).json();
                        const headers = ['Zeit', 'Admin', 'Aktion', 'Ziel', 'Details'];
                        const rows = (Array.isArray(logs) ? logs : []).map((log: any) => [
                          new Date(log.created_at).toISOString(),
                          (log.admin_name ?? '').replace(/"/g, '""'),
                          (log.action ?? '').replace(/"/g, '""'),
                          String(log.target_id ?? ''),
                          (log.details ?? '').replace(/"/g, '""')
                        ]);
                        const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(c => `"${c}"`).join(','))].join('\n');
                        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
                        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'audit-log.csv'; a.click(); URL.revokeObjectURL(a.href);
                      }}>Audit-Log exportieren (CSV)</Button>
                    </div>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-zinc-800">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/80 sticky top-0">
                          <tr>
                            <th className="p-2 text-zinc-500 font-semibold">Zeit</th>
                            <th className="p-2 text-zinc-500 font-semibold">Admin</th>
                            <th className="p-2 text-zinc-500 font-semibold">Aktion</th>
                            <th className="p-2 text-zinc-500 font-semibold">Ziel</th>
                            <th className="p-2 text-zinc-500 font-semibold">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminAuditLogs.map((log: any) => (
                            <tr key={log.id} className="border-t border-zinc-800/80">
                              <td className="p-2 text-zinc-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="p-2 text-zinc-300">{log.admin_name ?? '—'}</td>
                              <td className="p-2 text-zinc-300">{log.action ?? '—'}</td>
                              <td className="p-2 text-zinc-400">{log.target_id ?? '—'}</td>
                              <td className="p-2 text-zinc-500 max-w-xs truncate">{log.details ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {adminAuditLogs.length === 0 && <p className="p-4 text-zinc-600 text-sm italic">Keine Einträge.</p>}
                    </div>
                  </section>
                  </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Premium Footer */}
        {user && (
          <footer className="premium-footer mt-16 py-6 sm:py-8 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto safe-area-bottom">
            <div className="flex flex-wrap items-center justify-between gap-6 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              <div className="flex items-center gap-6">
                <span className="font-serif italic text-amber-500/80">Juwelen & Schmuckatelier Antonio Bellanova</span>
                <span>Ahorstraße 8 · 50765 Köln, Deutschland</span>
                <button type="button" onClick={() => setView('impressum')} className="hover:text-amber-500/80">{t('legal.imprint')}</button>
                <button type="button" onClick={() => setView('datenschutz')} className="hover:text-amber-500/80">{t('legal.privacy')}</button>
                <button type="button" onClick={() => setView('agb')} className="hover:text-amber-500/80">{t('legal.terms')}</button>
                <button type="button" onClick={() => setView('kontakt')} className="hover:text-amber-500/80">{t('legal.contact')}</button>
                <button type="button" onClick={() => setView('anfahrt')} className="hover:text-amber-500/80">{t('legal.directions')}</button>
              </div>
              <div className="flex items-center gap-4">
                <span>© {new Date().getFullYear()} Atelier</span>
                <span className="text-amber-500/60">Private Vault</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800/50 text-[9px] text-zinc-600 uppercase tracking-wider">
              {t('compliance.footer') || 'Governing law: Germany. Jurisdiction: Cologne. GDPR compliant. Consent and data access requests as per Privacy Policy.'}
            </div>
          </footer>
        )}

        {/* Piece Details Modal */}
        <AnimatePresence>
          {selectedPiece && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={closePieceDetail}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[90vh] overflow-y-auto">
                  <div className="aspect-square bg-zinc-900 relative">
                    {(() => {
                      const images = getPieceImages(selectedPiece);
                      const fallback = `https://picsum.photos/seed/${selectedPiece.id}/800/800`;
                      const src = images.length > 0 ? images[Math.min(pieceModalImageIndex, images.length - 1)] : (selectedPiece.image_url || fallback);
                      return (
                        <>
                          <img src={src} alt={selectedPiece.title} className="w-full h-full object-cover" />
                          {images.length > 1 && (
                            <>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setPieceModalImageIndex(i => (i - 1 + images.length) % images.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors" aria-label="Vorheriges Bild">
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setPieceModalImageIndex(i => (i + 1) % images.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors" aria-label="Nächstes Bild">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                                {images.map((_, idx) => (
                                  <button key={idx} type="button" onClick={(e) => { e.stopPropagation(); setPieceModalImageIndex(idx); }} className={`w-2 h-2 rounded-full transition-colors ${idx === pieceModalImageIndex ? 'bg-amber-500' : 'bg-white/40 hover:bg-white/60'}`} aria-label={`Bild ${idx + 1}`} />
                                ))}
                              </div>
                            </>
                          )}
                          <div className="absolute top-6 left-6">
                            <Badge variant="amber">{getRarityLabel(selectedPiece.rarity)}</Badge>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="p-4 sm:p-6 md:p-12 space-y-8 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif italic text-white">{selectedPiece.title}</h3>
                        {(() => {
                        const price = getPiecePriceDisplay(selectedPiece, user);
                        return <p className={price.showNegotiation || price.showInquiry ? 'text-zinc-500 italic' : 'text-amber-500 text-2xl font-bold'}>{price.label}</p>;
                      })()}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!user) return;
                            const add = !favoriteIds.includes(selectedPiece.id);
                            fetch('/api/analytics/favorite', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id, masterpieceId: selectedPiece.id, add })
                            }).then(() => setFavoriteIds(prev => add ? [...prev, selectedPiece.id] : prev.filter(id => id !== selectedPiece.id))).catch(() => {});
                          }}
                          className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-amber-500/80"
                          aria-label={favoriteIds.includes(selectedPiece.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart className={`w-6 h-6 ${favoriteIds.includes(selectedPiece.id) ? 'fill-amber-500/80 text-amber-500/80' : ''}`} />
                        </button>
                        <button onClick={closePieceDetail} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <Plus className="w-6 h-6 text-zinc-500 rotate-45" />
                      </button>
                      </div>
                    </div>

                    <div className="space-y-6 flex-1">
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('description')}</p>
                        <p className="text-zinc-400 leading-relaxed">{getPieceLocalized(selectedPiece, 'description')}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('materials')}</p>
                          <p className="text-zinc-200">{getPieceLocalized(selectedPiece, 'materials')}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('gemstones')}</p>
                          <p className="text-zinc-200">{getPieceLocalized(selectedPiece, 'gemstones')}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('common.serial_id')}</p>
                        <p className="font-mono text-xs text-zinc-400">{selectedPiece.serial_id}</p>
                      </div>
                      {selectedPiece.blockchain_hash && (
                        <div className="space-y-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                          <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> {t('piece.blockchain_verified')}
                          </p>
                          <p className="font-mono text-[10px] text-zinc-400 break-all">{selectedPiece.blockchain_hash}</p>
                        </div>
                      )}

                      {/* Registry 2.0 & Asset Performance */}
                      <div className="border-t border-zinc-800 pt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRegistryInModal(!showRegistryInModal);
                            if (!showRegistryInModal && selectedPiece?.id) {
                              if (!registryData[selectedPiece.id]) {
                                fetch(`/api/registry/masterpiece/${selectedPiece.id}`).then(r => r.ok ? r.json() : null).then(d => d && setRegistryData(prev => ({ ...prev, [selectedPiece!.id]: d }))).catch(() => {});
                              }
                              if (!performanceData[selectedPiece.id]) {
                                fetch(`/api/masterpieces/${selectedPiece.id}/performance`).then(r => r.ok ? r.json() : null).then(d => d && setPerformanceData(prev => ({ ...prev, [selectedPiece!.id]: d }))).catch(() => {});
                              }
                            }
                          }}
                          className="flex items-center justify-between w-full text-left text-sm font-medium text-zinc-300 hover:text-amber-500/90 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-amber-500/70" />
                            {t('registry.performance_title')}
                          </span>
                          <span className="text-zinc-500">{showRegistryInModal ? '−' : '+'}</span>
                        </button>
                        {showRegistryInModal && selectedPiece && (
                          <div className="mt-4 space-y-6 text-sm">
                            {registryData[selectedPiece.id] && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-amber-500/80 font-bold mb-2">{t('registry.ownership_timeline')}</p>
                                  <ul className="space-y-1.5 text-zinc-400">
                                    {(registryData[selectedPiece.id].ownership_history_timeline || registryData[selectedPiece.id].ownership_history || []).slice(0, 5).map((o: any, i: number) => (
                                      <li key={i}>{o.owner_name || '—'} · {o.acquired_at ? new Date(o.acquired_at).toLocaleDateString() : ''}</li>
                                    ))}
                                    {(!registryData[selectedPiece.id].ownership_history_timeline?.length && !registryData[selectedPiece.id].ownership_history?.length) && <li className="italic text-zinc-500">{t('registry.atelier_held')}</li>}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-amber-500/80 font-bold mb-2">{t('registry.service_log')}</p>
                                  <ul className="space-y-1.5 text-zinc-400">
                                    {(registryData[selectedPiece.id].service_history_log || registryData[selectedPiece.id].service_history || []).slice(0, 3).map((s: any, i: number) => (
                                      <li key={i}>{s.service_type} · {s.service_date ? new Date(s.service_date).toLocaleDateString() : ''}</li>
                                    ))}
                                    {(!registryData[selectedPiece.id].service_history_log?.length && !registryData[selectedPiece.id].service_history?.length) && <li className="italic text-zinc-500">—</li>}
                                  </ul>
                                </div>
                                <div className="md:col-span-2 flex flex-wrap gap-4">
                                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500/90 text-xs">{t('registry.rarity')}: {registryData[selectedPiece.id].rarity_level} ({registryData[selectedPiece.id].rarity_score ?? '—'})</span>
                                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500/90 text-xs">{t('registry.demand_index')}: {registryData[selectedPiece.id].demand_index ?? registryData[selectedPiece.id].demand_score ?? '—'}</span>
                                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500/90 text-xs">{t('registry.prestige_index')}: {registryData[selectedPiece.id].prestige_index ?? registryData[selectedPiece.id].prestige_score ?? '—'}</span>
                                  <span className="px-2 py-1 rounded bg-zinc-700/50 text-zinc-400 text-xs">{registryData[selectedPiece.id].ownership_history_badge}</span>
                                </div>
                              </div>
                            )}
                            {(performanceData[selectedPiece.id] || registryData[selectedPiece.id]?.asset_performance) && (() => {
                              const perf = performanceData[selectedPiece.id] || registryData[selectedPiece.id].asset_performance;
                              return (
                              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                                <p className="text-[10px] uppercase tracking-widest text-amber-500/80 font-bold">{t('registry.asset_performance')}</p>
                                <div className="flex flex-wrap gap-3 text-zinc-400">
                                  <span>{t('registry.demand_score')}: {perf.indicative_demand_score ?? perf.demand_index ?? '—'}</span>
                                  <span>{t('registry.resale_activity')}: {perf.resale_activity_level ?? '—'}</span>
                                  <span>{t('registry.liquidity')}: {perf.liquidity_indicator ?? '—'}</span>
                                  <span>{t('registry.views')}: {perf.views ?? perf.market_interest?.views ?? 0}</span>
                                  <span>{t('registry.saves')}: {perf.saves ?? perf.market_interest?.saves ?? 0}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 italic">{perf.disclaimer ?? 'Informational only. Not financial advice.'}</p>
                              </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-900 space-y-4">
                      {selectedPiece.status === 'available' && view !== 'admin' && (
                        <>
                          {(() => {
                            const price = getPiecePriceDisplay(selectedPiece, user);
                            if (price.showNegotiation) return (
                              <>
                                <p className="text-zinc-500 text-sm italic">{t('private_terms.request')}</p>
                                <Button className="w-full py-4 text-base" onClick={async () => {
                                  if (!user) return;
                                  setLoading(true);
                                  try {
                                    const res = await fetch('/api/private-terms/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ masterpiece_id: selectedPiece.id }), credentials: 'include' });
                                    if (res.ok) { notifyUser(t('private_terms.requested'), 'success'); closePieceDetail(); }
                                    else { const d = await res.json().catch(() => ({})); notifyUser(d.error || t('errors.generic'), 'error'); }
                                  } finally { setLoading(false); }
                                }}>
                                  <MessageCircle className="w-5 h-5" /> {t('private_terms.request')}
                                </Button>
                              </>
                            );
                            if (price.showInquiry) return (
                              <>
                                <p className="text-zinc-500 text-sm italic">{t('pricing.price_on_request')}</p>
                                <Button className="w-full py-4 text-base" onClick={async () => {
                                  if (!user) return;
                                  setLoading(true);
                                  try {
                                    const res = await fetch('/api/private-terms/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ masterpiece_id: selectedPiece.id }), credentials: 'include' });
                                    if (res.ok) { notifyUser(t('private_terms.requested'), 'success'); closePieceDetail(); }
                                    else { const d = await res.json().catch(() => ({})); notifyUser(d.error || t('errors.generic'), 'error'); }
                                  } finally { setLoading(false); }
                                }}>
                                  <MessageCircle className="w-5 h-5" /> {t('concierge.cta_title')}
                                </Button>
                              </>
                            );
                            return null;
                          })()}
                          {!getPiecePriceDisplay(selectedPiece, user).showNegotiation && !getPiecePriceDisplay(selectedPiece, user).showInquiry && (
                            <>
                              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                <p className="text-[10px] text-amber-500/80 leading-relaxed text-center italic">
                                  {t('legal_notice')}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-zinc-500 uppercase tracking-widest">{t('delivery.select')}</label>
                                <select value={deliveryOptionForModal} onChange={e => setDeliveryOptionForModal(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-200 text-sm">
                                  <option value="insured_global_shipping">{t('delivery.insured_global')}</option>
                                  <option value="armored_courier">{t('delivery.armored_courier')}</option>
                                  <option value="personal_delivery_founder">{t('delivery.personal_founder')}</option>
                                  <option value="private_viewing_appointment">{t('delivery.private_viewing')}</option>
                                  <option value="vault_storage">{t('delivery.vault_storage')}</option>
                                </select>
                              </div>
                              <Button className="w-full py-4 text-base" onClick={() => { handleBuy(selectedPiece.id, deliveryOptionForModal); closePieceDetail(); }}>
                                <ShoppingBag className="w-5 h-5" /> {t('request_acquisition')}
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      <Button variant="ghost" className="w-full py-3 text-sm text-zinc-400 flex items-center justify-center gap-2" onClick={() => { setView('concierge'); setChatDraft(`Anfrage zu: ${selectedPiece.title} (${selectedPiece.serial_id || ''})`); closePieceDetail(); }}>
                        <MessageCircle className="w-4 h-4" /> Concierge: Zu diesem Stück anfragen
                      </Button>
                      {user?.role === UserRole.ADMIN && (
                        <>
                          <Button variant="secondary" className="w-full py-3 text-sm" onClick={() => { setEditingPiece(selectedPiece); setView('admin'); setAdminTab('inventory'); closePieceDetail(); }}>
                            {t('admin.edit_piece')}
                          </Button>
                          <Button variant="danger" className="w-full py-3 text-sm" onClick={() => setDeletePieceConfirm({ piece: selectedPiece, password: '', error: '' })}>
                            Aus System entfernen (Admin)
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" className="w-full py-4 text-sm text-zinc-500" onClick={closePieceDetail}>
                        {t('close')}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Admin: Stück dauerhaft löschen – Passwort bestätigen */}
        <AnimatePresence>
          {deletePieceConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setDeletePieceConfirm(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                <h4 className="text-lg font-serif italic text-white mb-2">Stück dauerhaft aus System entfernen</h4>
                <p className="text-sm text-zinc-400 mb-4">&quot;{deletePieceConfirm.piece.title}&quot; ({(deletePieceConfirm.piece as any).serial_id}) wird unwiderruflich gelöscht.</p>
                <Input type="password" label="Admin-Passwort" value={deletePieceConfirm.password} onChange={(e: any) => setDeletePieceConfirm(prev => prev ? { ...prev, password: e.target.value, error: '' } : null)} placeholder="••••••••" />
                {deletePieceConfirm.error && <p className="text-sm text-red-400 mt-2">{deletePieceConfirm.error}</p>}
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" className="flex-1" onClick={() => setDeletePieceConfirm(null)} disabled={loading}>{t('cancel')}</Button>
                  <Button variant="danger" className="flex-1" onClick={handleDeleteMasterpiece} disabled={loading}>{loading ? '…' : 'Endgültig löschen'}</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Schedule Appointment Modal (when approving meeting request) */}
        <AnimatePresence>
          {appointmentModalRequest && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setAppointmentModalRequest(null)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4"
              >
                <h3 className="text-xl font-serif italic text-white">{t('admin.approve_request')} & {t('admin.schedule_appointment')}</h3>
                <p className="text-sm text-zinc-400">{t('admin.investor_label')}: {appointmentModalRequest.user_name} ({appointmentModalRequest.user_email})</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">{t('admin.appointment_date')}</label>
                    <input type="date" value={appointmentScheduleForm.date} onChange={e => setAppointmentScheduleForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">{t('admin.appointment_time')}</label>
                    <input type="time" value={appointmentScheduleForm.time} onChange={e => setAppointmentScheduleForm(f => ({ ...f, time: e.target.value }))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-200 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">{t('admin.appointment_title')}</label>
                  <input type="text" value={appointmentScheduleForm.title} onChange={e => setAppointmentScheduleForm(f => ({ ...f, title: e.target.value }))} placeholder={t('investor.schedule_meeting')} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">{t('admin.appointment_notes')}</label>
                  <textarea value={appointmentScheduleForm.notes} onChange={e => setAppointmentScheduleForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-200 text-sm resize-none" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setAppointmentModalRequest(null)}>{t('close')}</Button>
                  <Button variant="primary" className="flex-1" disabled={!appointmentScheduleForm.date} onClick={() => {
                    if (appointmentScheduleForm.date) handleScheduleAppointmentSubmit({ ...appointmentScheduleForm });
                  }}>{t('admin.approve_request')} & {t('admin.schedule_appointment')}</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Ownership Ceremony */}
        <AnimatePresence>
          {showCeremony && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="max-w-2xl w-full text-center space-y-12"
              >
                <div className="space-y-4">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20"
                  >
                    <Award className="w-12 h-12 text-amber-500" />
                  </motion.div>
                  <h2 className="text-4xl font-serif italic text-zinc-100">{t('ceremony.title')}</h2>
                  <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold">{t('ceremony.subtitle')}</p>
                </div>

                <div className="aspect-video rounded-[3rem] overflow-hidden border border-zinc-800 shadow-2xl relative group">
                  <img src={showCeremony.image_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-0 right-0">
                    <h3 className="text-2xl font-serif italic text-white">{showCeremony.title}</h3>
                    <p className="text-xs text-amber-500 uppercase tracking-widest mt-1">{t('ceremony.acquired_by')} {user?.name}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <p className="text-zinc-400 font-light leading-relaxed italic">
                    {t('ceremony.quote')}
                  </p>
                  <div className="flex flex-col gap-4">
                    <Button variant="primary" className="py-4 text-xs uppercase tracking-[0.2em] font-bold" onClick={() => setShowCeremony(null)}>
                      {t('ceremony.enter_vault')}
                    </Button>
                    <Button variant="ghost" className="text-zinc-500 text-[10px] uppercase tracking-widest" onClick={() => {
                      setShowCeremony(null);
                      setVaultTab('certs');
                    }}>
                      {t('ceremony.view_certificate')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -10, x: '-50%' }}
              className="fixed bottom-8 left-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl glass"
              style={{ borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}
            >
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <span className={toast.type === 'success' ? 'text-emerald-200' : 'text-red-200'}>{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signature / Accept Contract Modal */}
        <AnimatePresence mode="wait">
          {contractToSign ? (
            <SignatureModal
              key={contractToSign.id}
              contract={contractToSign}
              onClose={() => { setContractToSign(null); setContractSignError(null); }}
              onSign={handleSignContract}
              t={t}
              signError={contractSignError}
            />
          ) : null}
        </AnimatePresence>

        {/* Certificate Modal */}
        <AnimatePresence>
          {selectedCert && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={() => setSelectedCert(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="p-8 md:p-12 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-serif italic text-amber-500">{t('cert.title')}</h3>
                      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Antonio Bellanova Atelier</p>
                    </div>
                    <button onClick={() => setSelectedCert(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                      <Plus className="w-6 h-6 text-zinc-500 rotate-45" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('cert_details')}</p>
                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                          {selectedCert.content || `
ECHTHEITSZERTIFIKAT
-------------------
ID: ${selectedCert.cert_id}
STÜCK: ${masterpieces.find(m => m.id === selectedCert.masterpiece_id)?.title}
BESITZER: ${user.name}
DATUM: ${new Date(selectedCert.created_at).toLocaleDateString()}
                          `}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t('blockchain_hash')}</p>
                        <p className="font-mono text-[10px] text-zinc-400 break-all">{selectedCert.blockchain_hash}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t('digital_signature')}</p>
                        <p className="font-serif italic text-zinc-300">{selectedCert.signature}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="aspect-square bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center p-8">
                        <div className="w-32 h-32 bg-white p-2 rounded-xl mb-4">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://vault.bellanova.com/verify/${selectedCert.cert_id}`} alt="Verification QR" className="w-full h-full" />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 text-center">{t('scan_verify')}</p>
                      </div>
                      <Button className="w-full py-2 text-sm"><Download className="w-4 h-4" /> {t('download_pdf')}</Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Scroll to top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-500 hover:bg-zinc-700 transition-colors shadow-lg"
              aria-label="Nach oben"
            >
              <ChevronRight className="w-5 h-5 rotate-270" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Shortcuts modal */}
        <AnimatePresence>
          {showShortcutsModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/80" onClick={() => setShowShortcutsModal(false)} />
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <h3 className="text-lg font-serif italic">{t('shortcuts.title')}</h3>
                <ul className="text-sm text-zinc-400 space-y-2">
                  <li><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">Esc</kbd> {t('shortcuts.close_modal')}</li>
                  <li><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">Strg+K</kbd> {t('shortcuts.focus_search')}</li>
                  <li><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">?</kbd> {t('shortcuts.this_help')}</li>
                </ul>
                <Button variant="ghost" className="w-full" onClick={() => setShowShortcutsModal(false)}>{t('close')}</Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification prefs modal */}
        <AnimatePresence>
          {showNotificationPrefsModal && user && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/80" onClick={() => setShowNotificationPrefsModal(false)} />
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <h3 className="text-lg font-serif italic">{t('notifications.title')}</h3>
                <p className="text-xs text-zinc-500">{t('notifications.description')}</p>
                {['email_messages', 'email_contracts', 'email_auctions'].map(key => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={(notificationPrefs as any)[key]} onChange={e => setNotificationPrefs(p => ({ ...p, [key]: e.target.checked }))} className="rounded border-zinc-600" />
                    <span className="text-sm text-zinc-300">{key === 'email_messages' ? t('notifications.email_messages') : key === 'email_contracts' ? t('notifications.email_contracts') : t('notifications.email_auctions')}</span>
                  </label>
                ))}
                <Button variant="primary" className="w-full" onClick={async () => {
                  await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, notification_prefs: JSON.stringify(notificationPrefs) }) });
                  setShowNotificationPrefsModal(false);
                  notifyUser(t('common.settings_saved'), 'success');
                }}>{t('save')}</Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Helper Components ---

const NavItem = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group min-h-[44px] ${active ? 'bg-amber-600/10 text-amber-500' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}>
    <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-amber-500' : 'group-hover:text-amber-500'} transition-colors`} />
    <span className="block text-sm font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon }: any) => (
  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
    <Icon className="w-5 h-5 text-amber-500/50 mb-2" />
    <p className="text-2xl font-bold text-zinc-100">{value}</p>
    <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
  </div>
);

const TabButton = ({ active, label, onClick, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${active ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800'}`}>
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const PieceCard = ({ piece, onBuy, onViewDetails, hideAction, extraAction, t, getRarityLabel, isFavorite, onToggleFavorite, priceLabel }: { piece: Masterpiece, onBuy?: () => void, onViewDetails?: (p: Masterpiece) => void, hideAction?: boolean, extraAction?: React.ReactNode, t?: (k: string) => string, getRarityLabel?: (r: string) => string, key?: any, isFavorite?: boolean, onToggleFavorite?: () => void, priceLabel?: string }) => (
  <Card className="group hover:border-amber-600/30 transition-all duration-300" hoverGlow>
    <div className="aspect-square rounded-2xl bg-zinc-800 mb-4 overflow-hidden relative cursor-pointer" onClick={() => onViewDetails?.(piece)}>
      <img src={piece.image_url || `https://picsum.photos/seed/${piece.id}/600/600`} alt={piece.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
      {onToggleFavorite && (
        <button type="button" className="absolute top-3 left-3 p-2 rounded-full bg-black/50 hover:bg-black/70 z-10 backdrop-blur-sm transition-colors" onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} aria-label={isFavorite ? (t ? t('piece.remove_from_favorites') : 'Remove from favorites') : (t ? t('piece.add_to_favorites') : 'Add to favorites')}>
          <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-white'}`} />
        </button>
      )}
      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
        <Badge variant="amber">{getRarityLabel ? getRarityLabel(piece.rarity) : piece.rarity}</Badge>
        {piece.blockchain_hash && <Badge variant="verified" icon={ShieldCheck}>{t ? t('piece.blockchain_verified') : 'Verifiziert'}</Badge>}
      </div>
      {piece.status === 'reserved' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <Badge variant="amber">{t ? t('reserved') : 'Reserved'}</Badge>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full">
          <Eye className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-zinc-200 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => onViewDetails?.(piece)}>{piece.title}</h4>
        <p className={priceLabel != null && !priceLabel.endsWith(' €') ? 'text-zinc-500 italic text-sm' : 'text-amber-500/90 font-medium'}>{priceLabel != null ? priceLabel : (piece.valuation != null ? `${Number(piece.valuation).toLocaleString('de-DE')} €` : '—')}</p>
      </div>
      <p className="text-xs text-zinc-500 line-clamp-2">{piece.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="text-[8px] uppercase px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">ID: {piece.serial_id}</span>
        <span className="text-[8px] uppercase px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{piece.materials}</span>
      </div>
      {!hideAction && piece.status === 'available' && onBuy && (
        <Button variant="outline" className="w-full py-2 text-xs mt-4" onClick={onBuy}>
          <ShoppingBag className="w-4 h-4" /> Request Acquisition
        </Button>
      )}
      {extraAction}
    </div>
  </Card>
);

const AuctionCard = ({ auction, onBid, onViewDetails, userId, isFavorite, onToggleFavorite }: { auction: Auction, onBid: (amt: number) => void, onViewDetails?: (pId: number) => void, userId: number, key?: any, isFavorite?: boolean, onToggleFavorite?: () => void }) => {
  const [bidAmt, setBidAmt] = useState(auction.current_bid + 1000);
  const [showHistory, setShowHistory] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(auction.end_time).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.end_time]);

  // Update bid input when current bid changes
  useEffect(() => {
    setBidAmt(auction.current_bid + 1000);
  }, [auction.current_bid]);

  const fetchBids = async () => {
    try {
      const res = await fetch(`/api/auctions/${auction.id}/bids`);
      if (res.ok) {
        setBids(await res.json());
      }
    } catch (e) {
      console.error("Error fetching bids", e);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchBids();
    }
  }, [showHistory, auction.current_bid]);

  return (
    <Card className="group hover:border-amber-600/30 transition-all">
      <div className="aspect-square rounded-2xl bg-zinc-800 mb-4 overflow-hidden relative cursor-pointer" onClick={() => onViewDetails?.(auction.masterpiece_id)}>
        <img src={auction.image_url || `https://picsum.photos/seed/${auction.id}/600/600`} alt={auction.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        {onToggleFavorite && (
          <button type="button" className="absolute top-3 left-3 p-2 rounded-full bg-black/50 hover:bg-black/70 z-10" onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} aria-label={isFavorite ? (t ? t('piece.remove_from_favorites') : 'Remove from favorites') : (t ? t('piece.add_to_favorites') : 'Add to favorites')}>
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-white'}`} />
          </button>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          <Badge variant="red">Live Auction</Badge>
          {auction.vip_only === 1 && <Badge variant="amber">VIP Early Access</Badge>}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-zinc-200 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => onViewDetails?.(auction.masterpiece_id)}>{auction.title}</h4>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Current Bid</p>
            <motion.p 
              key={auction.current_bid}
              initial={{ scale: 1.2, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#f59e0b' }}
              transition={{ duration: 0.5 }}
              className="text-amber-500 font-bold text-lg"
            >
              {auction.current_bid.toLocaleString()} €
            </motion.p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
            <Clock className="w-4 h-4 text-amber-500" />
            <div className="flex flex-col">
              <p className="text-[8px] uppercase tracking-widest text-zinc-500">Time Left</p>
              <p className="text-[10px] text-zinc-200 font-mono font-bold">{timeLeft}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
            <Users className="w-4 h-4 text-zinc-500" />
            <div className="flex flex-col">
              <p className="text-[8px] uppercase tracking-widest text-zinc-500">Bidders</p>
              <p className="text-[10px] text-zinc-200 font-bold">{bids.length || '0'}</p>
            </div>
          </div>
        </div>

        {onBid && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Place Your Bid (€)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="number" 
                  value={bidAmt} 
                  onChange={(e) => setBidAmt(parseFloat(e.target.value))} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20" 
                />
              </div>
              <Button className="py-2.5 px-6 text-xs font-bold uppercase tracking-widest" onClick={() => onBid(bidAmt)}>Bid Now</Button>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 pt-2 border-t border-zinc-800/50">
          <button 
            onClick={() => { setShowHistory(!showHistory); setShowTerms(false); }}
            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors font-bold ${showHistory ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <History className="w-3 h-3" />
            History
          </button>
          <button 
            onClick={() => { setShowTerms(!showTerms); setShowHistory(false); }}
            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors font-bold ${showTerms ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <ShieldCheck className="w-3 h-3" />
            Terms
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {showHistory && (
            <motion.div 
              key="history"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                {bids.length > 0 ? bids.map((bid) => (
                  <div key={bid.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
                        {bid.bidder_name.charAt(0)}
                      </div>
                      <span className="text-xs text-zinc-300">{bid.bidder_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-500">{bid.amount.toLocaleString()} €</p>
                      <p className="text-[8px] text-zinc-600">{new Date(bid.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] text-zinc-600 italic text-center py-2">No bids yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {showTerms && (
            <motion.div 
              key="terms"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                  {auction.terms || "Standard luxury auction terms apply. All bids are binding. 10% buyer's premium will be added to the final hammer price. Secure, insured white-glove transport is included for the winning bidder."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {auction.highest_bidder_id === userId && (
          <div className="flex items-center gap-2 text-emerald-500 text-[10px] uppercase font-bold tracking-widest bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
            <CheckCircle className="w-3 h-3" /> You are the highest bidder
          </div>
        )}
      </div>
    </Card>
  );
};

const InvestorActionButton = ({ icon: Icon, title, description, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4 hover:bg-zinc-800 transition-all text-left group"
  >
    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
      <Icon className="w-5 h-5 text-zinc-500 group-hover:text-amber-500" />
    </div>
    <div>
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="text-[10px] text-zinc-500">{description}</p>
    </div>
  </button>
);

const EmptyState = ({ icon: Icon, text, subtitle }: any) => (
  <div className="col-span-full py-24 text-center border border-dashed border-zinc-800/80 rounded-3xl bg-zinc-950/30">
    <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
      <Icon className="w-8 h-8 text-amber-500/40" />
    </div>
    <p className="text-zinc-400 font-medium">{text}</p>
    {subtitle && <p className="text-xs text-zinc-600 mt-2 max-w-sm mx-auto">{subtitle}</p>}
  </div>
);

const BenefitItem = ({ icon: Icon, title, description }: any) => (
  <li className="flex gap-4">
    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-amber-500/50" />
    </div>
    <div>
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  </li>
);

const WorkflowTimeline = ({ masterpieceId, onAction }: { masterpieceId: number, onAction?: () => void }) => {
  const [workflow, setWorkflow] = useState<PurchaseWorkflow | null>(null);
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);

  const fetchStatus = () => {
    fetch(`/api/workflow/${masterpieceId}`).then(res => res.json()).then(setWorkflow);
    fetch(`/api/escrow/${masterpieceId}`).then(res => res.json()).then(setEscrow);
  };

  useEffect(() => {
    fetchStatus();
  }, [masterpieceId]);

  if (!workflow) return null;

  const steps = [
    { key: 'approved_at', label: 'Contract Generated', icon: FileText, status: 'WAITING_SIGNATURE' },
    { key: 'signed_at', label: 'Contract Signed', icon: Signature, status: 'SIGNED' },
    { key: 'deposit_paid_at', label: 'Deposit Paid', icon: CreditCard, status: 'RESERVED' },
    { key: 'production_finished_at', label: 'Final Invoice Issued', icon: FileDown, status: 'AWAITING_FINAL_PAYMENT' },
    { key: 'final_payment_pending_at', label: 'Final Payment Received', icon: Lock, status: 'FUNDS_HELD' },
    { key: 'completed_at', label: 'Ownership Transferred', icon: Award, status: 'COMPLETED' },
  ];

  const handleConfirmDelivery = async () => {
    const res = await fetch('/api/admin/workflow/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterpieceId, step: 'completed', adminId: 1 }) // In a real app, this would be a user action
    });
    if (res.ok) {
      fetchStatus();
      if (onAction) onAction();
    }
  };

  return (
    <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-zinc-800/40 space-y-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Diamond className="w-32 h-32 text-amber-500" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-1">Asset Journey</p>
          <h4 className="text-xl font-serif italic text-zinc-100">Provenance Timeline</h4>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5 px-4 py-1 text-[10px] uppercase tracking-widest font-bold">
          {workflow.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="relative space-y-8 pl-2">
        <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-gradient-to-b from-amber-500/50 via-zinc-800 to-zinc-900" />
        {steps.map((step, idx) => {
          const isCompleted = !!(workflow as any)[step.key] || (step.key === 'signed_at' && workflow.status !== 'WAITING_SIGNATURE');
          const isCurrent = workflow.status === step.status;
          
          const StepIcon = step.icon;
          
          return (
            <div key={idx} className="flex items-start gap-8 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-700 ${
                isCompleted 
                  ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                  : isCurrent 
                    ? 'bg-zinc-900 border-amber-500 text-amber-500 animate-pulse' 
                    : 'bg-black border-zinc-800 text-zinc-700'
              }`}>
                <StepIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-serif italic transition-colors ${isCompleted ? 'text-zinc-100' : isCurrent ? 'text-amber-500' : 'text-zinc-600'}`}>
                    {step.label}
                  </p>
                  {isCompleted && (
                    <span className="text-[9px] text-zinc-500 font-mono uppercase">
                      {new Date((workflow as any)[step.key]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                
                {isCurrent && step.key === 'ready_for_delivery_at' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    <Button variant="primary" className="w-full py-3 text-[10px] uppercase tracking-[0.2em] font-bold" onClick={handleConfirmDelivery}>
                      Confirm Secure Receipt
                    </Button>
                    <p className="text-[9px] text-zinc-500 mt-2 text-center italic">Confirming receipt will release escrow funds to the Atelier.</p>
                  </motion.div>
                )}

                {step.key === 'final_payment_pending_at' && escrow && (
                  <div className="mt-2 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500">Escrow Status</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${escrow.status === 'HELD' ? 'text-amber-500' : 'text-emerald-500'}`}>{escrow.status}</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${escrow.status === 'HELD' ? 'w-1/2 bg-amber-500' : 'w-full bg-emerald-500'}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminWorkflowChecklist = ({ piece, onUpdate }: { piece: Masterpiece, onUpdate: (id: number, step: string) => Promise<void>, key?: any }) => {
  const [workflow, setWorkflow] = useState<PurchaseWorkflow | null>(null);

  useEffect(() => {
    fetch(`/api/workflow/${piece.id}`).then(res => res.json()).then(setWorkflow);
  }, [piece.id]);

  if (!workflow) return null;

  const steps = [
    { id: 'deposit_paid', label: 'Confirm Deposit Received', key: 'deposit_paid_at' },
    { id: 'production_started', label: 'Start Production', key: 'production_started_at' },
    { id: 'production_finished', label: 'Mark Production Finished', key: 'production_finished_at' },
    { id: 'ready_for_delivery', label: 'Confirm Ready for Delivery', key: 'ready_for_delivery_at' },
    { id: 'final_payment_pending', label: 'Confirm Final Payment Pending', key: 'final_payment_pending_at' },
    { id: 'completed', label: 'Confirm Completed', key: 'completed_at' },
  ];

  return (
    <Card className="space-y-6 bg-zinc-950 border-zinc-800/50">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-100">{piece.title}</h4>
          <p className="text-[10px] text-zinc-500 font-mono">{piece.serial_id}</p>
        </div>
        <Badge variant="amber" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{workflow.status}</Badge>
      </div>
      <div className="space-y-4">
        {steps.map(step => {
          const isDone = !!(workflow as any)[step.key];
          return (
            <div key={step.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                <span className={`text-xs transition-colors ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-zinc-100'}`}>{step.label}</span>
              </div>
              <button 
                onClick={() => !isDone && onUpdate(piece.id, step.id)}
                disabled={!!isDone}
                className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                  isDone 
                    ? 'bg-amber-500 border-amber-500 text-black' 
                    : 'border-zinc-800 hover:border-amber-500/50 bg-zinc-900/50'
                }`}
              >
                {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3 h-3 text-zinc-600" />}
              </button>
            </div>
          );
        })}
        {workflow.status === 'COMPLETED' && (
          <div className="pt-4 border-t border-zinc-900">
            <Button variant="outline" className="w-full py-2 text-[10px] uppercase tracking-widest font-bold" onClick={() => (window as any).handleGenerateCertificate(piece.id)}>
              <Award className="w-3 h-3" /> Generate Official COA
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
