'use client';

import { useState } from 'react';
import { Button } from '@inngest/components/Button';
import { Link } from '@inngest/components/Link';
import { HorizontalPillList, Pill, PillContent } from '@inngest/components/Pill';
import { RiBarChart2Fill } from '@remixicon/react';

import MiniStackedBarChart from '@/components/Charts/MiniStackedBarChart';
import { useEnvironment } from '@/components/Environments/environment-context';
import LoadingIcon from '@/icons/LoadingIcon';
import { useEventTypes } from '@/queries';
import cn from '@/utils/cn';
import { pathCreator } from '@/utils/urls';
import EventListNotFound from './EventListNotFound';

export const EventList = () => {
  const [pages, setPages] = useState([1]);

  function appendPage() {
    setPages((prevPages) => {
      const lastPage = prevPages[prevPages.length - 1] ?? 0;
      return [...prevPages, lastPage + 1];
    });
  }

  return (
    <main className="min-h-0 flex-1 bg-slate-100">
      <table className="relative w-full border-b border-slate-200 bg-white">
        <thead className="shadow-outline-primary-light sticky top-0 z-10 bg-white">
          <tr>
            {['Event Name', 'Functions', 'Volume (24hr)'].map((heading, index) => (
              <th
                key={heading}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-2 py-3 text-left text-xs font-semibold text-slate-600',
                  index === 0 && 'pl-4'
                )}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="h-full divide-y divide-slate-100 px-4 py-3">
          {pages.map((page) => (
            <EventTypesListPaginationPage
              key={page}
              isLastLoadedPage={page === pages[pages.length - 1]}
              page={page}
              onLoadMore={appendPage}
            />
          ))}
        </tbody>
      </table>
    </main>
  );
};

type EventListPaginationPageProps = {
  isLastLoadedPage: boolean;
  page: number;
  onLoadMore: () => void;
};

function EventTypesListPaginationPage({
  isLastLoadedPage,
  page,
  onLoadMore,
}: EventListPaginationPageProps) {
  const env = useEnvironment();
  const [{ data, fetching: isFetchingEvents }] = useEventTypes({
    page,
  });

  const events = data?.workspace.events.data ?? [];
  const totalPages = data?.workspace.events.page.totalPages ?? 1;
  const hasNextPage = page < totalPages;
  const isFirstPage = page === 1;

  if (isFetchingEvents) {
    return (
      <tr>
        <td colSpan={3} className="h-56">
          <div className="relative flex items-center justify-center">
            <LoadingIcon />
          </div>
        </td>
      </tr>
    );
  }

  if (isFirstPage && events.length === 0) {
    return (
      <tr>
        <td colSpan={3}>
          <EventListNotFound />
        </td>
      </tr>
    );
  }

  return (
    <>
      {events.map((event) => {
        const dailyVolume = event.dailyVolume.total;

        // Creates an array of objects containing the volume for each usage slot (1 hour)
        const dailyVolumeSlots = event.dailyVolume.data.map((volumeSlot) => ({
          startCount: volumeSlot.count,
        }));

        return (
          <tr className="hover:bg-slate-50" key={event.name}>
            <td className="w-96 whitespace-nowrap">
              <div className="flex items-center gap-2.5 pl-2">
                <Link
                  href={pathCreator.eventType({ envSlug: env.slug, eventName: event.name })}
                  internalNavigation
                  className="w-full px-2 py-3 text-sm font-medium"
                >
                  {event.name}
                </Link>
              </div>
            </td>
            <td className="space-x-2 whitespace-nowrap px-2">
              <HorizontalPillList
                alwaysVisibleCount={2}
                pills={event.functions.map((function_) => (
                  <Pill
                    appearance="outlined"
                    href={pathCreator.function({
                      envSlug: env.slug,
                      functionSlug: function_.slug,
                    })}
                    key={function_.name}
                  >
                    <PillContent type="FUNCTION">{function_.name}</PillContent>
                  </Pill>
                ))}
              />
            </td>
            <td className="w-60 py-1 pl-2 pr-6">
              <div className="flex w-56 items-center justify-end gap-2">
                <div className="flex items-center gap-1 align-middle text-slate-600">
                  <RiBarChart2Fill className="-ml-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                  <span className="overflow-hidden whitespace-nowrap text-sm text-slate-600">
                    {dailyVolume.toLocaleString(undefined, {
                      notation: 'compact',
                      compactDisplay: 'short',
                    })}
                  </span>
                </div>
                <MiniStackedBarChart className="shrink-0" data={dailyVolumeSlots} />
              </div>
            </td>
          </tr>
        );
      })}

      {isLastLoadedPage && hasNextPage && (
        <tr>
          <td colSpan={3} className="py-2.5 text-center">
            <Button appearance="outlined" btnAction={onLoadMore} label="Load More" />
          </td>
        </tr>
      )}
    </>
  );
}
