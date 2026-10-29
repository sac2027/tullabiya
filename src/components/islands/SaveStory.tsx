import { useEffect, useState } from 'preact/hooks';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import { getApi } from '~/lib/api';

interface Props {
  lang: Lang;
  storyId: string;
}

/** Save for later. A toggle: 150ms color, press feedback, no celebration. */
export default function SaveStory({ lang, storyId }: Props) {
  const [saved, setSaved] = useState<boolean | null>(null);
  useEffect(() => {
    getApi().getSaved().then((s) => setSaved(s.includes(storyId)));
  }, [storyId]);
  return (
    <button
      type="button"
      class={`btn sm${saved ? ' done' : ''}`}
      aria-pressed={!!saved}
      disabled={saved === null}
      onClick={async () => setSaved((await getApi().toggleSaved(storyId)).includes(storyId))}
    >
      {saved ? t(lang, 'story.saved') : t(lang, 'story.save')}
    </button>
  );
}
