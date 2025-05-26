import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ColumnHeader } from "./FilterComponent";
import { DownloadButton } from "./Download";

export const IndividualComponent = ({ data, filterOptions, userRole, filters, onFilterChange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'metadata.createdAt', direction: 'desc' });
  const itemsPerPage = 15;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status) => ({
    submitted: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100",
    pending: "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100",
    active: "bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100",
    paid: "bg-green-50 text-green-700 border-green-200 shadow-green-100",
    unpaid: "bg-red-50 text-red-700 border-red-200 shadow-red-100"
  }[status?.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200 shadow-gray-100");

  const getUniqueValues = (field) => {
    let values;
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      values = [...new Set(data.map(item => {
        const value = item[parent]?.[child];
        return value != null ? String(value) : null;
      }))];
    } else {
      values = [...new Set(data.map(item => {
        const value = item[field];
        return value != null ? String(value) : null;
      }))];
    }
    return values.filter(Boolean).sort((a, b) => a.localeCompare(b));
  };

  const handleFilterChange = (field, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    setSortConfig(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const columnConfig = [
    { header: "Booking ID", field: "bookingId", sortable: true },
    { header: "Patient Name", field: "name", sortable: true },
    { header: "Age", field: "age", sortable: true },
    { header: "Gender", field: "gender", sortable: true },
    { header: "Test Name", field: "testName", sortable: true },
    { header: "Mobile", field: "mobileNo", sortable: true },
    { header: "City", field: "city", sortable: true },
    { header: "District", field: "district", sortable: true },
    { header: "Address", field: "address", sortable: true },
    { header: "Pincode", field: "pincode", sortable: true },
    { header: "Payment Mode", field: "paymentMode", sortable: true },
    { header: "Payment Status", field: "paymentStatus", sortable: true },
    { header: "Payment Reference", field: "paymentReference", sortable: true },
    { header: "Price", field: "price", sortable: true, type: "number" },
    { header: "Status", field: "metadata.status", sortable: true },
    { header: "Created At", field: "metadata.createdAt", sortable: true, type: "date" },
    { header: "Last Modified", field: "metadata.lastModified", sortable: true, type: "date" },
    { header: "Report Status Updated At", field: "metadata.reportStatusUpdatedAt", sortable: true, type: "date" },
    { header: "Report Status Updated By", field: "metadata.reportStatusUpdatedBy", sortable: true },
    { header: "Vendor Status Updated At", field: "metadata.vendorStatusUpdatedAt", sortable: true, type: "date" },
    { header: "Vendor Status Updated By", field: "metadata.vendorStatusUpdatedBy", sortable: true }
  ];

  const sortAndFilterData = (data) => {
    let filteredData = data.filter(item => {
      return Object.entries(columnFilters).every(([field, value]) => {
        if (!value) return true;
        
        let itemValue;
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          itemValue = item[parent]?.[child];
        } else {
          itemValue = item[field];
        }
        
        return String(itemValue).toLowerCase() === String(value).toLowerCase();
      });
    });

    if (sortConfig.field) {
      filteredData.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.field.includes('.')) {
          const [parent, child] = sortConfig.field.split('.');
          aValue = a[parent]?.[child];
          bValue = b[parent]?.[child];
        } else {
          aValue = a[sortConfig.field];
          bValue = b[sortConfig.field];
        }

        if (sortConfig.field.includes('At') || sortConfig.field.includes('Modified')) {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          // Numbers are already in correct format
        } else {
          aValue = (aValue ?? '').toString().toLowerCase();
          bValue = (bValue ?? '').toString().toLowerCase();
        }

        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    return filteredData;
  };

  const filteredAndSortedData = sortAndFilterData(data);
  const pageCount = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="mb-6 shadow-lg border border-gray-100 rounded-lg overflow-hidden">
      <CardHeader className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-gray-900 font-semibold">
            Individual Test Records
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors px-3 py-1 text-xs">
              Total: {filteredAndSortedData.length}
            </Badge>
            {Object.keys(columnFilters).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setColumnFilters({});
                  setActiveFilter(null);
                }}
                className="h-8 text-xs"
              >
                Clear All Filters
              </Button>
            )}
            {/* Download button - only visible for superadmin */}
            {userRole === "superadmin" && (
              <DownloadButton 
                data={filteredAndSortedData.map(record => {
                  const formattedRecord = { ...record };
                  if (record.metadata) {
                    Object.entries(record.metadata).forEach(([key, value]) => {
                      formattedRecord[`metadata.${key}`] = value;
                    });
                  }
                  return formattedRecord;
                })}
                filename="individual_test_records"
                columns={columnConfig}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                {columnConfig.map(({ header, field, sortable }) => (
                  <TableHead 
                    key={field}
                    className="text-xs font-medium text-gray-600 px-4 py-3 relative whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <ColumnHeader
                        field={field}
                        header={header}
                        value={columnFilters[field]}
                        options={getUniqueValues(field)}
                        onFilterChange={handleFilterChange}
                        isActive={activeFilter === field}
                        onFilterClick={(field) => setActiveFilter(field)}
                      />
                      {sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleSort(field)}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnConfig.length} className="text-center py-8">
                    <div className="flex flex-col items-center text-gray-500">
                      <span className="text-sm">No records found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((record) => (
                  <TableRow 
                    key={record.id} 
                    className="hover:bg-gray-50 transition-colors border-b"
                  >
                    {columnConfig.map(({ field, type }) => {
                      let value;
                      if (field.includes('.')) {
                        const [parent, child] = field.split('.');
                        value = record[parent]?.[child];
                      } else {
                        value = record[field];
                      }

                      return (
                        <TableCell 
                          key={field} 
                          className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap"
                        >
                          {field === 'paymentStatus' || field === 'metadata.status' ? (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-sm ${getStatusColor(value)}`}>
                              {value || 'N/A'}
                            </span>
                          ) : field === 'price' ? (
                            `₹${value || '0'}`
                          ) : type === 'date' ? (
                            formatDate(value)
                          ) : field === 'address' ? (
                            <div className="max-w-md truncate" title={value}>
                              {value || 'N/A'}
                            </div>
                          ) : (
                            value || 'N/A'
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
            <span className="text-xs text-gray-500">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
            </span>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              
              <span className="text-xs text-gray-600 min-w-[100px] text-center">
                Page {currentPage} of {pageCount}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IndividualComponent;