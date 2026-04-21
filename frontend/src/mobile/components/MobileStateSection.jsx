import { Card, Skeleton, Stack } from "@mui/material";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";

export function MobileLoadingState({ cards = 3 }) {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={index} sx={{ p: 2, borderRadius: 4 }}>
          <Stack spacing={1}>
            <Skeleton variant="text" width="60%" height={28} />
            <Skeleton variant="text" width="35%" />
            <Skeleton variant="rounded" height={56} />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

export function MobileEmptyState(props) {
  return <EmptyState {...props} />;
}

export function MobileErrorState(props) {
  return <ErrorState {...props} />;
}
