import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = Readonly<{
  changePageSize: (size: number) => void;
  pageSize: number;
}>;

export default function PageSizeSelector({ changePageSize, pageSize }: Props) {
  return (
    <div>
      <Select
        onValueChange={page => changePageSize(Number(page))}
        value={pageSize.toString()}>
        <SelectTrigger id="page-size" className="w-40">
          <SelectValue placeholder="Select page size" />
        </SelectTrigger>
        <SelectContent>
          {[3, 10, 20, 30, 40].map(pageSize => (
            <SelectItem value={pageSize.toString()} key={pageSize}>
              {pageSize} per page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
