import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface WebsiteRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebsiteRatingModal = ({ isOpen, onClose }: WebsiteRatingModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('website_ratings').insert({
        rating,
        feedback: feedback.trim() || null,
        user_id: user?.id || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setRating(0);
        setFeedback('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 max-w-md w-full"
          >
            <div className="bg-card rounded-xl border border-border shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Rate Your Experience</h2>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-green-500 fill-green-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Thank You!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your feedback helps us improve
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      How would you rate Gamchha Dukaan?
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="p-1"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= displayRating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    {displayRating > 0 && (
                      <p className="text-sm mt-2 text-primary font-medium">
                        {displayRating === 1 && 'Poor'}
                        {displayRating === 2 && 'Fair'}
                        {displayRating === 3 && 'Good'}
                        {displayRating === 4 && 'Very Good'}
                        {displayRating === 5 && 'Excellent'}
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <Textarea
                      placeholder="Share your experience with us (optional)"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={isSubmitting || rating === 0}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WebsiteRatingModal;