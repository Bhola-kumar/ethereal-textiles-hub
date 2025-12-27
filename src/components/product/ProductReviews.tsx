import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, User, MessageSquare, Loader2, ThumbsUp, ChevronDown, ChevronUp, Store, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useProductReviews, 
  useCreateReview, 
  useUserCanReview, 
  useCreateReviewReply, 
  useToggleReviewLike,
  useIsProductSeller,
  Review 
} from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

function ReviewCard({ 
  review, 
  productId, 
  currentUserId, 
  isSeller 
}: { 
  review: Review; 
  productId: string;
  currentUserId?: string;
  isSeller: boolean;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  const createReply = useCreateReviewReply();
  const toggleLike = useToggleReviewLike();

  const handleLike = () => {
    if (!currentUserId) return;
    toggleLike.mutate({
      reviewId: review.id,
      userId: currentUserId,
      isLiked: review.user_has_liked || false,
      productId,
    });
  };

  const handleSubmitReply = async () => {
    if (!currentUserId || !replyContent.trim()) return;
    
    await createReply.mutateAsync({
      reviewId: review.id,
      userId: currentUserId,
      content: replyContent.trim(),
      isSeller,
      productId,
    });
    
    setReplyContent('');
    setShowReplyForm(false);
    setShowReplies(true);
  };

  const repliesCount = review.replies?.length || 0;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={review.profiles?.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {review.profiles?.full_name || 'Anonymous'}
                </span>
                <Badge variant="outline" className="text-xs">
                  Verified Purchase
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? 'fill-primary text-primary'
                      : 'fill-muted text-muted'
                  }`}
                />
              ))}
            </div>
            {review.comment && (
              <p className="text-muted-foreground mb-3">{review.comment}</p>
            )}

            {/* Actions Row */}
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs gap-1.5 ${review.user_has_liked ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={handleLike}
                disabled={!currentUserId || toggleLike.isPending}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${review.user_has_liked ? 'fill-primary' : ''}`} />
                Helpful ({review.likes_count || 0})
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 text-muted-foreground"
                onClick={() => setShowReplyForm(!showReplyForm)}
                disabled={!currentUserId}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </Button>

              {repliesCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 text-muted-foreground"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {repliesCount} {repliesCount === 1 ? 'Reply' : 'Replies'}
                </Button>
              )}
            </div>

            {/* Reply Form */}
            <AnimatePresence>
              {showReplyForm && currentUserId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="flex gap-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={isSeller ? "Reply as seller..." : "Ask a question or add a comment..."}
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="hero"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || createReply.isPending}
                    >
                      {createReply.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Replies List */}
            <AnimatePresence>
              {showReplies && review.replies && review.replies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3 border-l-2 border-border/50 pl-4 overflow-hidden"
                >
                  {review.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        {reply.is_seller ? (
                          <AvatarFallback className="bg-primary/20">
                            <Store className="h-3 w-3 text-primary" />
                          </AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {reply.is_seller ? 'Seller' : (reply.profiles?.full_name || 'Anonymous')}
                          </span>
                          {reply.is_seller && (
                            <Badge variant="secondary" className="text-xs">
                              <Store className="h-2.5 w-2.5 mr-1" />
                              Seller Response
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(reply.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { user } = useAuth();
  const { data: reviews = [], isLoading } = useProductReviews(productId, user?.id);
  const { data: reviewPermission } = useUserCanReview(productId, user?.id);
  const { data: isSeller = false } = useIsProductSeller(productId, user?.id);
  const createReview = useCreateReview();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmitReview = async () => {
    if (!user) return;

    await createReview.mutateAsync({
      productId,
      userId: user.id,
      rating,
      comment,
    });

    setShowReviewForm(false);
    setRating(5);
    setComment('');
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100
      : 0,
  }));

  return (
    <section className="py-12 lg:py-16 border-t border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl lg:text-3xl font-display font-bold mb-8">
            Customer Reviews
          </h2>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Rating Summary */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold gradient-text mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(averageRating)
                            ? 'fill-primary text-primary'
                            : 'fill-muted text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                  {ratingCounts.map(({ stars, count, percentage }) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-sm w-8">{stars} ★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  ))}
                </div>

                {/* Write Review Button */}
                <div className="mt-6">
                  {!user ? (
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">
                        Sign in to Write a Review
                      </Button>
                    </Link>
                  ) : reviewPermission?.hasReviewed ? (
                    <p className="text-sm text-center text-muted-foreground">
                      You have already reviewed this product
                    </p>
                  ) : reviewPermission?.canReview ? (
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Write a Review
                    </Button>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground">
                      Purchase and receive this product to leave a review
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Review Form or Reviews List */}
            <div className="lg:col-span-2">
              {showReviewForm && reviewPermission?.canReview && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <Card className="bg-card/50 border-primary/30">
                    <CardHeader>
                      <CardTitle className="text-lg">Write Your Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Star Rating */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  star <= (hoverRating || rating)
                                    ? 'fill-primary text-primary'
                                    : 'fill-muted text-muted'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Review</label>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={`Share your experience with ${productName}...`}
                          rows={4}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="hero"
                          onClick={handleSubmitReview}
                          disabled={createReview.isPending}
                        >
                          {createReview.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Submit Review
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowReviewForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Reviews List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ReviewCard 
                        review={review} 
                        productId={productId}
                        currentUserId={user?.id}
                        isSeller={isSeller}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                    <p className="text-muted-foreground text-center">
                      Be the first to review this product!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
