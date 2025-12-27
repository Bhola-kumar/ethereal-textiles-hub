-- Create review_replies table for threaded discussions
CREATE TABLE public.review_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_seller BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create review_likes table for supporting reviews
CREATE TABLE public.review_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_replies
CREATE POLICY "Anyone can view review replies"
ON public.review_replies FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create replies"
ON public.review_replies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
ON public.review_replies FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for review_likes
CREATE POLICY "Anyone can view review likes"
ON public.review_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like reviews"
ON public.review_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike reviews"
ON public.review_likes FOR DELETE
USING (auth.uid() = user_id);