import { useState, useEffect } from 'react';
import { Crown, Check, X, Wallet, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { KHQRPaymentDialog } from './payment/KHQRPaymentDialog';
import { AuthDialog } from './AuthDialog';
import { motion, AnimatePresence } from 'framer-motion';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number;
  duration_unit: string;
  device_limit: number;
  show_ads: boolean;
  is_active: boolean;
}

interface MobileVIPPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileVIPPanel({ open, onOpenChange }: MobileVIPPanelProps) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [currentMembership, setCurrentMembership] = useState<any>(null);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchPlans();
      if (user) {
        fetchWalletBalance();
        checkCurrentMembership();
      }
    }
  }, [open, user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setWalletBalance(data?.wallet_balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const checkCurrentMembership = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentMembership(data);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const handleSelectPlan = (plan: MembershipPlan) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setSelectedPlan(plan);
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    fetchWalletBalance();
    checkCurrentMembership();
  };

  const handleTopUp = () => {
    setShowQRPayment(true);
  };

  const handleQRPaymentSuccess = (newBalance: number) => {
    setWalletBalance(newBalance);
    setShowQRPayment(false);
    toast({
      title: 'Top-up Successful',
      description: `New balance: $${newBalance.toFixed(2)}`,
    });
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) return;

    if (walletBalance < selectedPlan.price) {
      toast({
        title: 'Insufficient Balance',
        description: `You need $${selectedPlan.price.toFixed(2)} to subscribe.`,
        variant: 'destructive'
      });
      return;
    }

    setProcessingPurchase(true);

    try {
      const { error } = await supabase.rpc('purchase_membership_with_wallet', {
        p_user_id: user.id,
        p_plan_id: selectedPlan.id,
        p_amount: selectedPlan.price
      });

      if (error) throw error;

      toast({
        title: 'VIP Activated!',
        description: `Welcome to ${selectedPlan.name}`,
      });

      onOpenChange(false);
      setSelectedPlan(null);
      fetchWalletBalance();
      checkCurrentMembership();
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setProcessingPurchase(false);
    }
  };

  const features = [
    'Unlimited HD streaming',
    'No advertisements',
    'Download for offline',
    'Early access to new content'
  ];

  return (
    <>
      <Sheet open={open && !showQRPayment && !showAuthDialog} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-3xl bg-black/95 border-white/10 p-0 overflow-hidden"
        >
          {/* Header */}
          <SheetHeader className="relative p-4 pb-3">
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 to-transparent" />
            <div className="relative flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-white">
                <Crown className="h-6 w-6 text-yellow-400" />
                Join VIP
              </SheetTitle>
              <button 
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full bg-white/10"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
          </SheetHeader>

          <div className="overflow-y-auto h-full pb-20">
            {/* Current membership status */}
            {currentMembership && (
              <div className="mx-4 mb-4 flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">
                  Active: {currentMembership.membership_type}
                </span>
              </div>
            )}

            {/* Wallet balance */}
            {user && (
              <div className="mx-4 mb-4 flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm text-white/70">Wallet</span>
                </div>
                <span className="font-bold text-white">${walletBalance.toFixed(2)}</span>
              </div>
            )}

            {/* Features */}
            <div className="mx-4 mb-4 bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">VIP Benefits</p>
              <div className="space-y-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plans */}
            <AnimatePresence mode="wait">
              {!selectedPlan ? (
                <motion.div 
                  key="plans"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-4 space-y-3"
                >
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    plans.map((plan, index) => {
                      const isCurrentPlan = currentMembership?.membership_type === plan.name;
                      const isPopular = index === 1;
                      
                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                          className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                            isPopular 
                              ? 'bg-yellow-500/10 border-yellow-500/30' 
                              : 'bg-white/5 border-white/10'
                          } ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
                        >
                          {isPopular && (
                            <div className="absolute -top-2 right-3 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                              POPULAR
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{plan.name}</p>
                              <p className="text-xs text-white/50">
                                {plan.duration} {plan.duration_unit} • {plan.device_limit} devices
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-white">${plan.price}</p>
                              <p className="text-[10px] text-white/40">
                                ${(plan.price / plan.duration).toFixed(2)}/day
                              </p>
                            </div>
                          </div>
                          
                          {isCurrentPlan && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                              <span className="text-sm text-green-400 font-medium">Current Plan</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-4 space-y-4"
                >
                  {/* Selected plan */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{selectedPlan.name}</span>
                      <span className="text-lg font-bold text-white">${selectedPlan.price}</span>
                    </div>
                    <p className="text-xs text-white/50">
                      {selectedPlan.duration} {selectedPlan.duration_unit}
                    </p>
                  </div>

                  {/* Balance check */}
                  {walletBalance < selectedPlan.price ? (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                      <p className="text-sm text-red-400 mb-2">Insufficient Balance</p>
                      <p className="text-xs text-red-400/70 mb-3">
                        Need ${(selectedPlan.price - walletBalance).toFixed(2)} more
                      </p>
                      <Button 
                        onClick={handleTopUp}
                        variant="outline"
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        Top Up Wallet
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-green-400/70">After purchase</p>
                      <p className="text-lg font-semibold text-green-400">
                        ${(walletBalance - selectedPlan.price).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPlan(null)}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handlePurchase}
                      disabled={processingPurchase || walletBalance < selectedPlan.price}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                    >
                      {processingPurchase ? (
                        <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                      ) : (
                        `Pay $${selectedPlan.price}`
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>

      {/* QR Payment Dialog */}
      <KHQRPaymentDialog 
        isOpen={showQRPayment}
        onClose={() => setShowQRPayment(false)}
        onSuccess={handleQRPaymentSuccess}
      />

      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default MobileVIPPanel;
